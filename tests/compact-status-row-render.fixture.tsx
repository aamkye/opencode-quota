import { testRender } from "@opentui/solid"

import { CompactStatusRow, type PanelTheme } from "../tui/presentation/compact-panel.js"

const theme: PanelTheme = {
  error: "#ff0000",
  warning: "#ffaa00",
  success: "#00ff00",
  text: "#ffffff",
  textMuted: "#888888",
}

export async function renderCompactStatusRow(width: number) {
  const setup = await testRender(
    () => (
      <box width={width} height={1}>
        <CompactStatusRow name="codegraph-global" label="Connected" status="success" theme={() => theme} />
      </box>
    ),
    { width, height: 1 },
  )
  await setup.renderOnce()
  const frame = setup.captureCharFrame()
  setup.renderer.destroy()
  return frame
}
