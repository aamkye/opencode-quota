import type { PanelModel } from "../tui/presentation/types.js"

export const model: PanelModel = {
  id: "quota",
  order: 10,
  title: "Quota",
  collapsedSummary: { kind: "text", text: "2 limits" },
  groups: [
    {
      id: "usage",
      order: 10,
      header: { title: "Usage", collapsible: true },
      items: [
        { id: "account", order: 10, kind: "header", title: "Primary account", status: "success" },
        { id: "notice", order: 20, kind: "text", text: "Limits refresh automatically.", maxWidth: 40 },
        { id: "progress", order: 30, kind: "progress", label: "Weekly", value: 45, total: 100, status: "warning" },
        { id: "timer", order: 40, kind: "timer", label: "Resets", state: "countdown", epoch: 1_752_300_000_000, detail: "in 2h" },
        { id: "quantity", order: 50, kind: "quantity", label: "Requests", value: 1_024, unit: "count", align: "end" },
        {
          id: "models",
          order: 60,
          kind: "table",
          columns: [
            { id: "model", order: 10, title: "Model", align: "start" },
            { id: "remaining", order: 20, title: "Remaining", align: "end" },
          ],
          rows: [
            {
              id: "gpt",
              order: 10,
              cells: [
                { kind: "text", text: "GPT" },
                { kind: "quantity", value: 80, unit: "count" },
              ],
            },
          ],
        },
      ],
    },
  ],
}
