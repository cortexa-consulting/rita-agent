# Security

This kit has three parts, and only one of them runs code:

- **RITA** (`CLAUDE.md`) and the **AISLE skills** (`skills/`) are
  instructions only: text files Claude reads. No connectors, no MCP servers,
  no hooks, and nothing is sent anywhere.
- **Redact & Restore** (`tools/redact-restore/redact-restore.html`) is one
  page that runs in your browser, on your computer. It has no network access
  at all: its built-in Content Security Policy blocks every connection, and
  the pages it saves are locked against scripts. It is a single readable
  file, so you can check this yourself.
- **The data pack** (`data-pack/`) is invented. Every name, number and
  contact in it is fictional.

The risks the kit deals with are in what Claude reads and writes while
following it, and in what Redact & Restore misses: client data, licensed
data, and instructions planted in email, files or web pages.

## Reporting a problem

Please report these privately:

- A way RITA or a skill could lead Claude to expose confidential
  information, follow a planted instruction, or send or share something.
- A way Redact & Restore could send data anywhere, run a script from a file
  or an answer, put a real value into a link, or restore a value it
  shouldn't.

To report: on this repository's **Security** tab, choose **Report a
vulnerability**, or write to us through
https://www.cortexa-consulting.ai/contact.

Please don't open a public issue for these, and don't include real client
data in any report. A made-up example that shows the behavior is enough.

A name or number Redact & Restore didn't find on its own is worth reporting
too. Open an issue with a made-up example in the same shape. The tool finds
what you list and the patterns it knows; always read the redacted text
before you paste it.

Confirmed problems are fixed in a new release and noted in `CHANGELOG.md`.

## Supported versions

Only the latest release is supported. In Claude, the AISLE plugin's
**Update** button brings in the newest skills; download the repository again
for the newest RITA and Redact & Restore. Keep one copy of Redact & Restore,
the newest: a key saved by a newer copy won't open in an older one.
