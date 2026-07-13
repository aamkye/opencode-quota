import type { PanelItem } from "../tui/presentation/types.js"

const invalidTimer: PanelItem = {
  id: "invalid-timer-state",
  order: 10,
  kind: "timer",
  label: "Resets",
  state: "running",
}

void invalidTimer
