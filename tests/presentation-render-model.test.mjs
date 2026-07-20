import assert from "assert/strict"
import test from "node:test"

import { normalizePanelModel, toggleCollapsed } from "../.tmp-test/presentation-renderer.mjs"

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
  assert.equal(progress.allocation.bar, 8)
  assert.equal(timer.text, "resets in 1h 0m")
  assert.equal(timer.detail, "Provider supplied reset time")
  assert.equal(table.layout, "compact")
  assert.deepEqual(table.columns.map((column) => column.id), ["model", "remaining"])
  assert.deepEqual(table.rows[0], {
    id: "gpt",
    cells: [{ text: "GPT" }, { text: "80" }],
  })
})

test("keeps panel and group collapse state independent", () => {
  const groupCollapsed = toggleCollapsed(new Set(), "group:other-providers")
  const panelAndGroupCollapsed = toggleCollapsed(groupCollapsed, "panel:usage")

  assert.equal(groupCollapsed.has("group:other-providers"), true)
  assert.equal(groupCollapsed.has("panel:usage"), false)
  assert.equal(panelAndGroupCollapsed.has("panel:usage"), true)
  assert.equal(panelAndGroupCollapsed.has("group:other-providers"), true)

  const uncollapsed = toggleCollapsed(panelAndGroupCollapsed, "panel:usage")
  assert.equal(uncollapsed.has("panel:usage"), false)
  assert.equal(uncollapsed.has("group:other-providers"), true)
})

test("normalizes ordered header detail segments and keeps pure text readable", () => {
  const model = {
    id: "quota",
    order: 10,
    title: "Quota",
    groups: [{
      id: "providers",
      order: 10,
      items: [
        { id: "ordinary", order: 10, kind: "header", title: "Ordinary", detail: "Limited", status: "error" },
        {
          id: "openai",
          order: 20,
          kind: "header",
          title: "OpenAI: Pro",
          detailSegments: [{ text: "stale", status: "warning" }],
        },
        {
          id: "zai",
          order: 30,
          kind: "header",
          title: "Z.AI: Max",
          detailSegments: [
            { text: "Off-Peak (1x)", status: "success" },
            { text: " / ", status: "textMuted" },
            { text: "stale", status: "warning" },
          ],
        },
      ],
    }],
  }

  const normalized = normalizePanelModel(model)
  assert.deepEqual(normalized.groups[0].items[2].detailSegments, [
    { text: "Off-Peak (1x)", status: "success" },
    { text: " / ", status: "textMuted" },
    { text: "stale", status: "warning" },
  ])
})
