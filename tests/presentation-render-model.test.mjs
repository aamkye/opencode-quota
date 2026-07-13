import assert from "node:assert/strict"
import test from "node:test"

import { normalizePanelModel } from "../.tmp-test/presentation-renderer.mjs"

test("normalizes a generic panel into stable, compact render rows", () => {
  const model = {
    id: "quota-panel",
    order: 10,
    title: "An intentionally overlong quota panel title",
    collapsedSummary: { kind: "text", text: "51%/80%", status: "warning" },
    groups: [
      {
        id: "other-providers",
        order: 20,
        header: { title: "Other providers", collapsible: true },
        items: [
          { id: "z-header", order: 50, kind: "header", title: "Account", detail: "Standard" },
          { id: "a-text", order: 50, kind: "text", text: "Usage is current." },
          { id: "m-progress", order: 50, kind: "progress", label: "Weekly", value: 51, total: 100 },
          {
            id: "n-timer",
            order: 50,
            kind: "timer",
            label: "Resets",
            state: "countdown",
            epoch: 3_600_000,
            detail: "Provider supplied reset time",
          },
          { id: "q-quantity", order: 50, kind: "quantity", label: "Requests", value: 1_024, unit: "count" },
          {
            id: "t-table",
            order: 50,
            kind: "table",
            columns: [
              { id: "remaining", order: 20, title: "Remaining", align: "end" },
              { id: "model", order: 10, title: "Model" },
            ],
            rows: [
              {
                id: "gpt",
                order: 10,
                cells: [
                  { kind: "quantity", value: 80, unit: "count" },
                  { kind: "text", text: "GPT" },
                ],
              },
            ],
          },
        ],
      },
    ],
  }

  const normalized = normalizePanelModel(model, { availableCells: 16, now: 0 })
  const group = normalized.groups[0]
  const progress = group.items.find((item) => item.id === "m-progress")
  const timer = group.items.find((item) => item.id === "n-timer")
  const table = group.items.find((item) => item.id === "t-table")

  assert.equal(normalized.id, "quota-panel")
  assert.equal(normalized.title, "An intentionall…")
  assert.deepEqual(normalized.header.cells.at(-1), {
    id: "quota-panel:summary",
    text: "51%/80%",
    status: "warning",
  })
  assert.deepEqual(normalized.header.summary, {
    id: "quota-panel:summary",
    text: "51%/80%",
    status: "warning",
  })
  assert.equal(group.id, "other-providers")
  assert.deepEqual(group.header, {
    id: "other-providers:header",
    title: "Other providers",
    collapsible: true,
  })
  assert.deepEqual(group.items.map((item) => item.id), ["a-text", "m-progress", "n-timer", "q-quantity", "t-table", "z-header"])
  assert.equal(progress.percent, "51%")
  assert.equal(progress.allocation.bar, 7)
  assert.equal(timer.text, "Resets: resets in 1h 0m")
  assert.equal(timer.detail, "Provider supplied reset time")
  assert.equal(table.layout, "compact")
  assert.deepEqual(table.columns.map((column) => column.id), ["model", "remaining"])
  assert.deepEqual(table.rows[0], {
    id: "gpt",
    cells: ["GPT", "80"],
  })
})
