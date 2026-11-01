---
name: new-workflow
description: Sets up a recurring multi-stage job (a quarterly business review, a monthly recap, a launch readout) as a workflow folder of numbered stages, each with a short contract saying what it takes in, what it hands on, which skill does the work and what a person checks; then runs it one stage at a time, stopping for that check. Use when asked to set up a workflow, a pipeline or a repeatable process, to break a recurring job into stages or steps, or to run the next stage of one. Not for making one deliverable on its own (use that deliverable's skill) or for setting up an account.
---

# New workflow

Some jobs come back every month or quarter and pass through the same steps:
check the data, build the grid, make the deck, review it. Done in one long
chat, the steps blur, nobody checks the middle, and next quarter starts from
scratch. A workflow folder fixes that: each stage gets its own small brief
(a contract), a person checks the work between stages, and when a stage keeps
going wrong you fix its contract, not just this quarter's file.

This skill has two jobs. **Set up** builds the folders and runs nothing.
**Run** does one stage and stops. Never both in one turn.

## Before you build

1. **Look first.** If `projects/<account>/workflows/<workflow>/` already
   exists, change nothing in it. Say what is there and offer to run its next
   stage, or to add a stage that's missing.
2. **Get the job, once.** From the request and the account's files, find:
   what the finished thing is, who it's for and by when; the stages, in
   order (three to six); and for each stage, what it takes in, what it hands
   on, which skill does the work, and what a person checks before the next
   one. If the request doesn't say, propose the stages as a short numbered
   list and wait for a yes or changes before building. Ask one question at a
   time, and only what you need.
3. **Point, don't copy.** A contract names the files a stage reads (the
   client's brief, the brand guide, the data) by path. It never copies their
   contents, and never holds client figures, contact details or anything
   confidential. Rules that belong to the account stay in its `brief.md`;
   rules that belong to a skill stay in the skill; license terms stay where
   the data's owner wrote them. A contract names the file (and its section)
   a rule lives in; it doesn't restate or paraphrase the rule. Anything
   neither the request nor the files say is "to confirm", never a guess.
4. **Stages hand on files, not memory.** Each stage reads its contract, the
   files it names, and whatever the named skill's own rules tell it to check
   (a data check reads the inbox for explanations, for example), so any
   stage can run in a fresh chat, on another day, by another person.

## What to build

The workflow folder name is short, lowercase, with hyphens (`q3-qbr`). It
goes in `projects/<account>/workflows/<workflow>/`, or inside an engagement
(`projects/<account>/<engagement>/workflows/<workflow>/`).

- `README.md`: what the workflow produces, for whom and by when; the stages
  in order, one line each; how to run one ("Run stage 02 of the q3-qbr
  workflow"); where the finished deliverable goes (`outputs/<account>/`);
  and a **Runs** log, empty, for one line per stage run.
- One folder per stage, numbered: `01-<stage>/`, `02-<stage>/`, and so on,
  each holding an empty `out/` folder and a `CONTRACT.md`:

  ```
  # Stage NN: <name>

  - Takes in: <files by path, or ../NN-<stage>/out/ from the stage before>
  - Hands on: <file name(s)>, saved to out/
  - Done by: <skill name, or "Claude, from this contract">
  - Rules for this stage: <only what this stage needs; point to brief.md,
    reference/ or the skill for the rest>
  - Check before the next stage: <what the person confirms, as questions>
  ```

- The last stage also saves the finished deliverable to
  `outputs/<account>/` (or the engagement's outputs folder). Every other
  stage keeps its files in its own `out/`. Setting up makes nothing outside
  the workflow folder.

`examples/dalton-q3-qbr/` beside this file is a four-stage workflow built
from the course's practice data: its `README.md` and the four
`NN-<stage>/CONTRACT.md` files. Follow their shape, not their words.

## Running a stage

1. **Read the README and that stage's contract.** Check that what it takes in
   exists. If it takes the stage before's `out/`, that stage must show as
   checked in the README's Runs log. If it doesn't, say so and stop, unless
   the person tells you to go ahead.
2. **Do the work with the named skill,** following that skill's own rules
   (its data checks, its look, its never-send rules). The contract adds to
   them; it doesn't replace them.
3. **Save to this stage's `out/`.** The last stage also saves to
   `outputs/<account>/`. Nothing else in the workflow folder changes,
   apart from the Runs line (step 5) and a contract fix the person approves
   (step 6).
4. **Stop.** Show what you made and where, then put the contract's check to
   the person as questions. Never start the next stage in the same turn.
5. **Log it.** Add one line to the README's Runs log: the date, the stage,
   what was saved, and "check: pending". Change that to "checked" only when
   the person says so.
6. **Fix the source.** If the person corrects the same kind of thing at a
   stage more than once (this run or in the Runs log), propose one line for
   that stage's contract, the account's `brief.md` or the skill, whichever
   caused it. Write it only on a yes. Editing the output fixes this run;
   editing the contract fixes every run after it.

## Where things go

These lines fit the course workspace (`about-me/`, `projects/<account>/`,
`outputs/`). Skip any part that isn't there. `projects/rita-agent/` is the
course kit, never an account: its practice data is for Dalton, its practice
client. List `projects/` first, and never say an account's folder is missing
without having listed it.

- **Read the account first:** its `brief.md` and `memory.md`, and use its
  `reference/` folder. A workflow for an engagement reads that folder's
  `brief.md` and `memory.md` too.
- **Send nothing.** A workflow ends in a file for a person to check and
  send. No stage emails, posts or shares anything.
- **Working files stay out of the workspace.** Build scripts, test renders
  and scratch copies go in a temporary folder outside it, or are deleted when
  you finish; only what a stage hands on lands in its `out/`.
- **Offer a memory line.** After setting up, or after the last stage, write
  out a one- or two-line entry for the account's `memory.md` (the workflow,
  where it is, what's next) and offer to add it. Write it only on a yes, with
  no client figures, contact details, anything confidential, or any
  decision the person hasn't made.

## When you're done setting up

List every folder and file you made. Then give the person the one line that
runs the first stage ("Run stage 01 of the <workflow> workflow"), and say
that each stage stops for their check before the next.
