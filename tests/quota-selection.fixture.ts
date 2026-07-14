import { createRoot } from "solid-js"

import { createQuotaSelection } from "../tui/quota.js"

export function mountQuotaSelection(...args: Parameters<typeof createQuotaSelection>) {
  let selection!: ReturnType<typeof createQuotaSelection>
  let dispose: () => void = () => undefined
  createRoot((cleanup) => {
    dispose = cleanup
    selection = createQuotaSelection(...args)
  })
  return { ...selection, dispose }
}
