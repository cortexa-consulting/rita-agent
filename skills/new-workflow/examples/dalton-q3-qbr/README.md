# Workflow: Dalton Q3 QBR deck

A worked example of what the `new-workflow` skill builds, made from the
course's practice data. In your workspace it would sit at
`projects/dalton/workflows/q3-qbr/`. It holds contracts only: every `out/`
folder is empty until a stage runs.

- **Produces:** the Q3 quarterly business review deck for Dalton's VP of
  Retail Sales.
- **For:** Rachel Kim (Brand Manager, Retail Channel), who presents it.
- **By when:** the deck to Rachel by noon on Wednesday, November 11, 2026;
  the QBR is Thursday, November 12, 2026, 2:00pm CT.
- **Finished deck goes to:** `outputs/dalton/`.

## Stages

1. `01-data-check/`: check the Q3 sell-through export and list every
   problem, with the decision each one needs.
2. `02-grid/`: build the retailer-by-week Excel grid, using the decisions
   from stage 1.
3. `03-deck/`: build the six-to-eight-slide deck from the grid, the deck
   brief and Dalton's brand guide.
4. `04-review/`: review the deck against the brief, then save the finished
   copy for Rachel.

## How to run it

One stage at a time, in a project for Dalton: "Run stage 01 of the q3-qbr
workflow." Each stage stops so you can check its work. The next stage won't
start until this log says the one before it is checked.

## Runs

| Date | Stage | Saved | Check |
| --- | --- | --- | --- |
