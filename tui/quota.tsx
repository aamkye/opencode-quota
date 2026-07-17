import { createMemo } from "solid-js"

import { PanelRenderer, type PanelTheme } from "./presentation/renderer.js"
import type {
  QuotaProviderAdapter,
} from "../shared/opencode-tools-shared.js"
import {
  createQuotaSelection,
  defineTuiPlugin,
  pluginDescriptor,
  quotaAdapterShared,
} from "../shared/opencode-tools-shared.js"

type QuotaSelectionController = ReturnType<typeof createQuotaSelection>

const plugin = defineTuiPlugin(pluginDescriptor("quota"), (context, api, rawOptions) => {
  const options = quotaAdapterShared.normalizeOptions(rawOptions)
  const demand = quotaAdapterShared.quotaProviderDemand(options)
  const providers: QuotaProviderAdapter[] = []
  context.onCleanup(() => providers.forEach((provider) => provider.dispose()))
  providers.push(quotaAdapterShared.createZaiProvider(api, demand.zai))
  providers.push(quotaAdapterShared.createOpenAiProvider(api, demand.openai))
  providers.push(quotaAdapterShared.createOpenCodeGoProvider(api, demand.openCodeGo))
  const selection: QuotaSelectionController = quotaAdapterShared.createSelection(api, providers)
  const model = createMemo(() => quotaAdapterShared.composePanel(selection.selectedProviderID(), providers, options))
  const theme = () => api.theme.current as PanelTheme

  api.slots.register({
    // The aggregate owns the sole sidebar slot at the legacy Z.AI registration order.
    order: quotaAdapterShared.sidebarSlotOrder,
    slots: {
      sidebar_content(_ctx, props) {
        const sessionID = props.session_id ?? ""
        selection.setSessionID(sessionID)
        for (const provider of providers) provider.setSessionID(sessionID)
        return <PanelRenderer model={model} theme={theme} />
      },
    },
  })
})

export { createQuotaSelection } from "../shared/opencode-tools-shared.js"
export default plugin
