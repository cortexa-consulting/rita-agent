#!/usr/bin/env node
/**
 * Pins redact-restore.html's Content-Security-Policy to the page's own
 * <style> and <script>. Run after editing either:
 *
 *   node update-csp.mjs
 *
 * The policy allows exactly those two blocks and nothing else (no network,
 * no other scripts), so an edit that is not re-pinned simply stops the page
 * from running rather than loosening it. redact-restore.test.mjs fails if the
 * pinned hashes and the page drift apart.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE = join(dirname(fileURLToPath(import.meta.url)), "redact-restore.html");

export function blocks(html) {
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  return { style, script };
}
export const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("base64");

if (import.meta.url === `file://${process.argv[1]}`) {
  const html = readFileSync(FILE, "utf8");
  const { style, script } = blocks(html);
  const next = html
    .replace(/script-src 'sha256-[^']*'/, `script-src 'sha256-${sha256(script)}'`)
    .replace(/style-src 'sha256-[^']*'/, `style-src 'sha256-${sha256(style)}'`);
  writeFileSync(FILE, next);
  console.log(next === html ? "CSP already current." : "CSP hashes updated.");
}
