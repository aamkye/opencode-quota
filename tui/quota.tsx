import { createMemo } from "solid-js"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

import { PanelRenderer, type PanelTheme } from "./presentation/renderer.js"
import type {
  QuotaProviderAdapter,
} from "../shared/opencode-tools-shared.js"
import {
  acquireQuotaProviderHub,
  createQuotaSelection,
  defineTuiPlugin,
  pluginDescriptor,
  quotaAdapterShared,
  type QuotaProviderDemand,
  type QuotaProviderHub,
  type ServiceLease,
  type TuiFeatureContext,
} from "../shared/opencode-tools-shared.js"

type QuotaSelectionController = ReturnType<typeof createQuotaSelection>

type HubMeta = {
  acquireHub?: typeof acquireQuotaProviderHub
}

function acquireHub(
  context: TuiFeatureContext,
  api: TuiPluginApi,
  demand: QuotaProviderDemand,
  meta: unknown,
): ServiceLease<QuotaProviderHub> {
  const injected = meta && typeof meta === "object" ? (meta as HubMeta).acquireHub : undefined
  return (injected ?? acquireQuotaProviderHub)({ ...context, api }, demand)
}

function quotaHubDemand(options: ReturnType<typeof quotaAdapterShared.normalizeOptions>): QuotaProviderDemand {
  const demand = quotaAdapterShared.quotaProviderDemand(options)
  return {
    consumer: "quota",
    refreshIntervalMs: options.refreshIntervalMs,
    zai: { hideTools: demand.zai.hideTools },
    openCodeGo: demand.openCodeGo,
  }
}

function liveProviders(providers: () => readonly QuotaProviderAdapter[]): readonly QuotaProviderAdapter[] {
  return new Proxy([] as QuotaProviderAdapter[], {
    get(_target, property) {
      const current = providers()
      const value = Reflect.get(current, property, current)
      return typeof value === "function" ? value.bind(current) : value
    },
    has(_target, property) {
      return property in providers()
    },
    ownKeys() {
      return Reflect.ownKeys(providers())
    },
    getOwnPropertyDescriptor(_target, property) {
      const descriptor = Object.getOwnPropertyDescriptor(providers(), property)
      return descriptor ? { ...descriptor, configurable: true } : undefined
    },
  })
}

const plugin = defineTuiPlugin(pluginDescriptor("quota"), (context, api, rawOptions, meta) => {
  const options = quotaAdapterShared.normalizeOptions(rawOptions)
  const hub = acquireHub(context, api, quotaHubDemand(options), meta)
  const currentProviders = () => hub.value.providers()
  const providers = liveProviders(currentProviders)
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
        for (const provider of currentProviders()) provider.setSessionID(sessionID)
        return <PanelRenderer model={model} theme={theme} />
      },
    },
  })
})

export { createQuotaSelection } from "../shared/opencode-tools-shared.js"
export default plugin
