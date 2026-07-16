import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { createMemo } from "solid-js"

import { PanelRenderer, type PanelTheme } from "./presentation/renderer.js"
import type { PanelModel } from "./presentation/types.js"
import * as quotaShared from "../shared/opencode-tools-shared.js"
import type {
  NormalizedQuotaOptions,
  QuotaCompositionOptions,
  QuotaProviderAdapter,
  QuotaSelection,
} from "../shared/opencode-tools-shared.js"

const SIDEBAR_ORDER = 110
const shared = quotaShared as Record<string, unknown>
const normalizeOptions = shared["normalizeQuota" + "Options"] as (value?: unknown) => NormalizedQuotaOptions
const composePanel = shared["composeQuota" + "Panel"] as (
  selection: QuotaSelection,
  providers: readonly QuotaProviderAdapter[],
  requestedOptions?: QuotaCompositionOptions,
) => PanelModel
const createSelection = quotaShared.createQuotaSelection
const quotaProviderDemand = quotaShared.quotaProviderDemand
const createZaiProvider = quotaShared.createZaiProvider
const createOpenAiProvider = quotaShared.createOpenAiProvider
const createOpenCodeGoProvider = quotaShared.createOpenCodeGoProvider

const tui: TuiPlugin = async (api, rawOptions) => {
  const options = normalizeOptions(rawOptions)
  const demand = quotaProviderDemand(options)
  const providers: QuotaProviderAdapter[] = []
  api.lifecycle.onDispose(() => providers.forEach((provider) => provider.dispose()))
  providers.push(createZaiProvider(api, demand.zai))
  providers.push(createOpenAiProvider(api, demand.openai))
  providers.push(createOpenCodeGoProvider(api, demand.openCodeGo))
  const selection = createSelection(api, providers)
  const model = createMemo(() => composePanel(selection.selectedProviderID(), providers, options))
  const theme = () => api.theme.current as PanelTheme

  api.slots.register({
    // The aggregate owns the sole sidebar slot at the legacy Z.AI registration order.
    order: SIDEBAR_ORDER,
    slots: {
      sidebar_content(_ctx, props) {
        const sessionID = props.session_id ?? ""
        selection.setSessionID(sessionID)
        for (const provider of providers) provider.setSessionID(sessionID)
        return <PanelRenderer model={model} theme={theme} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "aamkye/opencode-tools",
  tui,
}

export { createQuotaSelection } from "../shared/opencode-tools-shared.js"
export default plugin
