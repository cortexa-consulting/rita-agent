// Run: node --test "tools/redact-restore/*.test.mjs"
//
// Tests the optional PDF reader (PdfReader) on the PDFs in fixtures/, each
// written by a different program: LibreOffice, reportlab, Chromium, a scanner
// stand-in, a password, and one built by hand to cover what the others don't
// (packed objects, a cross-reference stream, glyph-number fonts, kerning).
// The code under test is the page's own script, extracted from
// redact-restore.html, as in redact-restore.test.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { deflateSync } from "node:zlib";

import { blocks } from "./update-csp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const { script } = blocks(readFileSync(join(HERE, "redact-restore.html"), "utf8"));
const ctx = vm.createContext({ TextEncoder, TextDecoder, ReadableStream, DecompressionStream, CompressionStream, atob });
vm.runInContext(`${script}\nthis.R = RedactCore; this.P = PdfReader;`, ctx);
const { R, P } = ctx;

const fixture = (name) => new Uint8Array(readFileSync(join(HERE, "fixtures", name)));
const read = async (name) => P.read(fixture(name));
const lines = (page) => page.split("\n");

const LISTS = { COMPANY: "Dalton Computers\nBest Byte\nValuMart", PERSON: "Rachel Kim\nMarcus Webb\nTaylor Brooks", PRODUCT: "Project Falcon\nFalcon\nVantage 16" };
const OPTS = { email: true, phone: true, ssn: true, card: true, money: false, url: false, terms: "", lists: LISTS };
const ORIGINALS = ["Dalton Computers", "Best Byte", "ValuMart", "Rachel Kim", "Marcus Webb", "Taylor Brooks", "Falcon", "rachel.kim@", "marcus.webb@", "taylor.brooks@", "555-0125", "555-0188"];
const survivors = (text) => ORIGINALS.filter((o) => text.toLowerCase().includes(o.toLowerCase()));

/** A small PDF with these objects, its streams compressed, for the hostile cases. */
function pdf(objects) {
  let out = "%PDF-1.7\n";
  for (const [num, body, stream] of objects) {
    if (stream === undefined) out += `${num} 0 obj\n${body}\nendobj\n`;
    else {
      const z = Buffer.from(deflateSync(Buffer.from(stream, "latin1"))).toString("latin1");
      out += `${num} 0 obj\n<< ${body} /Filter /FlateDecode /Length ${z.length} >>\nstream\n${z}\nendstream\nendobj\n`;
    }
  }
  return Uint8Array.from(out + "trailer\n<< /Root 1 0 R >>\n%%EOF\n", (c) => c.charCodeAt(0));
}
const ONE_PAGE = (contents, resources = "<< /Font << /F1 4 0 R >> >>") => [
  [1, "<< /Type /Catalog /Pages 2 0 R >>"],
  [2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"],
  [3, `<< /Type /Page /Parent 2 0 R /Resources ${resources} /Contents 5 0 R >>`],
  [4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"],
  [5, "", contents],
];

test("LibreOffice's PDF of a Word document: every line, the table cells, header and footer, in reading order", async () => {
  const r = await read("doc.pdf");
  assert.equal(r.pages.length, 1);
  assert.equal(r.scanned, false);
  const l = lines(r.pages[0]);
  for (const want of [
    "Confidential: Best Byte",
    "Dalton Computers: Q3 notes",
    "Endcaps at Best Byte open on Nov 9 for Project Falcon.",
    "Rachel Kim approved the ValuMart test.",
    "Write to Rachel Kim with questions.",
    "Prepared by Taylor Brooks",
  ]) assert.ok(l.includes(want), want);
  assert.ok(l.indexOf("Confidential: Best Byte") < l.indexOf("Prepared by Taylor Brooks"));
  // A name in bold and then italics ("Best " + "Byte") reads as one name.
  assert.match(r.pages[0], /Endcaps at Best Byte open/);
});

test("LibreOffice's PDF of a deck: one page per slide, in order, with the table's rows on their own lines", async () => {
  const r = await read("deck.pdf");
  assert.ok(r.pages.length >= 5);
  assert.match(r.text, /^Page 1\nQ3 Review: Dalton Computers at\nBest Byte\n/);
  assert.match(r.pages[1], /^Project Falcon launch plan\n/);
  assert.ok(lines(r.pages[2]).includes("Best Byte 6,399 Rachel Kim"));
  assert.ok(lines(r.pages[2]).includes("ValuMart 4,343 Marcus Webb"));
});

test("reportlab with the standard fonts: a name across a bold and an italic run, a curly apostrophe, two pages", async () => {
  const r = await read("report.pdf");
  assert.deepEqual([...r.pages], [
    [
      "Weekly report: Dalton Computers",
      "Endcaps at Best Byte open on Nov 9 for Project Falcon.",
      "Owner: Rachel Kim, rachel.kim@daltoncomputers.example, (214) 555-0125.",
      "Marcus Webb’s ValuMart test sold 4,343 units for $128,400.",
    ].join("\n"),
    "Page two: Prepared by Taylor Brooks.",
  ]);
  assert.match(r.text, /^Page 1\nWeekly report[\s\S]*\n\nPage 2\nPage two: /);
});

test("Chromium's Save as PDF (Type0 fonts with ToUnicode maps): table cells keep their spaces", async () => {
  const r = await read("chrome.pdf");
  assert.deepEqual(lines(r.pages[0]), [
    "Falcon at Best Byte",
    "Endcaps at Best Byte open on Nov 9 for Project Falcon.",
    "Rachel Kim rachel.kim@daltoncomputers.example (214) 555-0125",
    "Marcus Webb marcus.webb@valumart.example (214) 555-0188",
    "Prepared by Taylor Brooks.",
  ]);
});

test("a PDF packed the modern way: object streams, a cross-reference stream in place of a table, glyph-number fonts, kerning, a form", async () => {
  const r = await read("packed.pdf");
  assert.deepEqual([...r.pages], [
    // Words placed one at a time; a space made by kerning; kerning inside a word that is not a space;
    // a form drawn with its own font and a /Differences apostrophe.
    "Best Byte\nRachel Kim\nValuMart\n(214) 555-0125\nMarcus Webb’s store",
    // The second page sits in a nested page tree and inherits the fonts from its parent.
    "Page two: Dalton Computers",
  ]);
});

test("read text redacts like any other text: nothing survives, except where the PDF itself split or glued a value", async () => {
  for (const name of ["report.pdf", "chrome.pdf", "packed.pdf", "deck.pdf", "doc.pdf"]) {
    const { text } = await read(name);
    const out = R.redactText(text, OPTS, new R.Session());
    // doc.pdf shows the two ways a PDF's own layout defeats matching, which is
    // why the page says to read the text before redacting: its narrow table cell
    // printed the email over two lines ("rachel.kim@daltoncomputer" / "s.example"),
    // and its tracked change printed the deleted words flush against the inserted
    // ones ("Marcus WebbProject"). The glued name is now caught whole (a
    // capital starting the next word counts as a word's edge), and the split
    // address loses its name ("rachel.kim" run together), but the domain the
    // PDF broke in two still survives.
    assert.deepEqual(survivors(out), [], name);
    if (name === "doc.pdf") {
      assert.match(out, /pricing for \[PERSON-\d+\]Project \[PRODUCT-\d+\] timing/);
      assert.match(out, /\[PERSON-\d+\]@daltoncomputer\ns\.example/);
    }
  }
});

test("a scan (pictures, no text) is reported as one, and a password-protected PDF is refused", async () => {
  const scan = await read("scan.pdf");
  assert.equal(scan.empty, true);
  assert.equal(scan.scanned, true);
  await assert.rejects(read("locked.pdf"), /encrypted/);
  await assert.rejects(P.read(fixture("doc.docx")), /not-pdf/);
  await assert.rejects(P.read(new TextEncoder().encode("%PDF-1.4\nnothing here\n%%EOF")), /not-pdf/);
});

test("ToUnicode maps: single codes, runs that count up, listed runs, ligatures and two-byte codes", () => {
  const cmap = P.parseCMap(`
    1 begincodespacerange <0000> <FFFF> endcodespacerange
    2 beginbfchar <0003> <0020> <0051> <00660069> endbfchar
    2 beginbfrange <0024> <0026> <0041> <0030> <0031> [<00E9> <D83DDE00>] endbfrange`);
  const get = (code) => cmap.map.get(`2:${code}`);
  assert.deepEqual([...cmap.lengths], [2]);
  assert.equal(get(0x03), " ");
  assert.equal(get(0x51), "fi");
  assert.equal([get(0x24), get(0x25), get(0x26)].join(""), "ABC");
  assert.equal(get(0x30), "é");
  assert.equal(get(0x31), "😀");
});

test("strings and names: escapes, octal codes, balanced parentheses, #-escaped names", () => {
  const lx = new P.Lexer(String.raw`(a\(b\) (c) \101\\ \n) /My#20Font <48 69> [1 2 0 R]`);
  assert.equal(lx.value().str, "a(b) (c) A\\ \n");
  assert.equal(lx.value().name, "My Font");
  assert.equal(lx.value().str, "Hi");
  const arr = lx.value();
  assert.equal(arr[0], 1);
  assert.equal(arr[1].ref, 2);
});

test("hostile PDFs end quickly: a form that draws itself, a page tree that loops, nesting that never closes", async () => {
  const selfDrawing = await P.read(pdf([
    ...ONE_PAGE("/X Do /X Do BT /F1 12 Tf 72 700 Td (top) Tj ET", "<< /Font << /F1 4 0 R >> /XObject << /X 6 0 R >> >>"),
    [6, "/Type /XObject /Subtype /Form /BBox [0 0 1 1] /Resources << /XObject << /X 6 0 R >> >>", "/X Do /X Do"],
  ]));
  assert.equal(selfDrawing.pages[0], "top");

  const looped = await P.read(pdf([
    [1, "<< /Type /Catalog /Pages 2 0 R >>"],
    [2, "<< /Type /Pages /Kids [2 0 R 3 0 R] /Count 1 >>"],
    [3, "<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"],
    [4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"],
    [5, "", "BT /F1 12 Tf (once) Tj ET"],
  ]));
  assert.deepEqual([...looped.pages], ["once"]);

  // Deep nesting either reads or fails with an error the page can show; it never hangs.
  const deep = pdf(ONE_PAGE(`${"[".repeat(200000)} BT /F1 12 Tf (x) Tj ET`));
  await P.read(deep).then(
    (r) => assert.equal(typeof r.text, "string"),
    (err) => assert.ok(err instanceof Error || err.name === "RangeError"),
  );
});

test("the reader is its own section of the page, written to be read, and it only reads", () => {
  const start = script.indexOf("/* PdfReader: the text inside a PDF");
  const end = script.indexOf("return { read, parseCMap, Lexer };");
  assert.ok(start > 0 && end > start);
  const section = script.slice(start, end);
  assert.match(section, /It never changes the PDF, and it never makes a redacted PDF/);
  // Nothing in its code (comments aside) reaches the network or the page.
  const code = section.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(code, /\b(fetch|XMLHttpRequest|WebSocket|document|window|localStorage|eval|Function)\b/);
});

test("with the PDF option, a PDF warning points at the checkbox; without it (step 2), it explains copying", () => {
  const on = R.incompatibleHelp("x.pdf", "pdf", false, { pdfOption: true });
  assert.match(on.lead, /^“x\.pdf” is a PDF\. Reading PDFs is off/);
  assert.match(on.steps[0], /tick Read PDF files/);
  assert.match(on.steps.join(" "), /Ctrl\+A.*Ctrl\+C.*Paste copied text/);
  const off = R.incompatibleHelp("x.pdf", "pdf", false);
  assert.doesNotMatch(off.steps.join(" "), /Read PDF files/);
  assert.match(R.incompatibleHelp("x.pdf", "scan", false).lead, /pages are pictures/);
});

/** Resolves to "read" or "too-large" within `ms`, or fails: a hostile PDF must end quickly, either way. */
async function ends(bytes, ms = 5000) {
  const t = Date.now();
  const how = await P.read(bytes).then(
    () => "read",
    (e) => e.message,
  );
  assert.ok(Date.now() - t < ms, `took ${Date.now() - t} ms`);
  return how;
}
const SLOW = { timeout: 60000 };

test("a packed-object stream claiming a billion objects ends quickly", SLOW, async () => {
  const how = await ends(pdf([...ONE_PAGE("BT /F1 12 Tf (x) Tj ET"), [7, "/Type /ObjStm /N 1000000000 /First 4", "9 0 "]]));
  assert.equal(how, "read");
});

test("a ToUnicode map that never closes its sections, or expands to millions of codes, ends quickly", SLOW, () => {
  let t = Date.now();
  P.parseCMap("beginbfrange <00> ".repeat(50000) + "beginbfchar <00> ".repeat(50000));
  assert.ok(Date.now() - t < 2000, `open sections took ${Date.now() - t} ms`);
  t = Date.now();
  const lines = Array.from({ length: 64 }, (_, k) => `<${(k + 1).toString(16).padStart(2, "0")}0000> <${(k + 1).toString(16).padStart(2, "0")}FFFF> <0041>`);
  const big = P.parseCMap(`beginbfrange\n${lines.join("\n")}\nendbfrange` + "\nbeginbfrange <0000> <FFFF> <0041> endbfrange".repeat(200));
  assert.ok(Date.now() - t < 2000, `expansion took ${Date.now() - t} ms`);
  assert.ok(big.map.size <= 200000, `${big.map.size} codes`);
});

test("one long kerned line, and one enormous string, end quickly", SLOW, async () => {
  assert.equal(await ends(pdf(ONE_PAGE(`BT /F1 12 Tf [${"(a) -300 ".repeat(200000)}] TJ ET`))), "read");
  // The same, as separate runs with a gap between each.
  assert.equal(await ends(pdf(ONE_PAGE(`BT /F1 12 Tf ${"(a) Tj 20 0 Td ".repeat(200000)} ET`))), "read");
  assert.equal(await ends(pdf(ONE_PAGE(`BT /F1 12 Tf (${"a".repeat(30_000_000)}) Tj ET`)), 15000), "too-large");
});

test("one stream drawn hundreds of times counts every time against the limit", SLOW, async () => {
  const objs = ONE_PAGE(" ".repeat(1_000_000) + "BT /F1 12 Tf (x) Tj ET");
  objs[2] = [3, `<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents [${"5 0 R ".repeat(300)}] >>`];
  assert.equal(await ends(pdf(objs)), "too-large");
});

test("objects that never close a string or a stream end quickly", SLOW, async () => {
  let s = "%PDF-1.7\n";
  for (let k = 1; k <= 60000; k++) s += `${k} 0 obj\n(\n`;
  assert.ok(["read", "too-large", "not-pdf"].includes(await ends(Uint8Array.from(s, (c) => c.charCodeAt(0)))));
  s = "%PDF-1.7\n";
  for (let k = 1; k <= 20000; k++) s += `${k} 0 obj\n<< /Length 999999 >>\nstream\n${"x".repeat(20)}\n`;
  assert.ok(["read", "too-large", "not-pdf"].includes(await ends(Uint8Array.from(s, (c) => c.charCodeAt(0)))));
});

test("ASCII85 that unpacks past the limit is refused before it is unpacked", SLOW, async () => {
  const body = "z".repeat(60_000_000);
  const objs = [...ONE_PAGE("BT ET"), [7, `<< /Filter /ASCII85Decode /Length ${body.length} >>\nstream\n${body}~>\nendstream`]];
  objs[2] = [3, "<< /Type /Page /Parent 2 0 R /Resources << >> /Contents [5 0 R 7 0 R] >>"];
  assert.equal(await ends(pdf(objs), 15000), "too-large");
});
