import { createMemo, createSignal } from "solid-js"
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

export const quotaProviderHubTestKey = Symbol("quota-provider-hub-test")

function acquireHub(
  context: TuiFeatureContext,
  api: TuiPluginApi,
  demand: QuotaProviderDemand,
  meta: unknown,
): ServiceLease<QuotaProviderHub> {
  const injected = meta && typeof meta === "object"
    ? (meta as Record<PropertyKey, unknown>)[quotaProviderHubTestKey]
    : undefined
  const acquire = typeof injected === "function"
    ? injected as typeof acquireQuotaProviderHub
    : acquireQuotaProviderHub
  return acquire({ ...context, api }, demand)
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

function reactiveProviders(providers: () => readonly QuotaProviderAdapter[]): readonly QuotaProviderAdapter[] {
  type Predicate = (provider: QuotaProviderAdapter, index: number, values: readonly QuotaProviderAdapter[]) => unknown
  // Quota helpers only use these methods; each read tracks the current hub signal.
  return {
    filter(predicate: Predicate, thisArg?: unknown) {
      return providers().filter(predicate, thisArg)
    },
    find(predicate: Predicate, thisArg?: unknown) {
      return providers().find(predicate, thisArg)
    },
    some(predicate: Predicate, thisArg?: unknown) {
      return providers().some(predicate, thisArg)
    },
  } as unknown as readonly QuotaProviderAdapter[]
}

const plugin = defineTuiPlugin(pluginDescriptor("quota"), (context, api, rawOptions, meta) => {
  const options = quotaAdapterShared.normalizeOptions(rawOptions)
  const hub = acquireHub(context, api, quotaHubDemand(options), meta)
  const [currentProviders, setCurrentProviders] = createSignal(hub.value.providers())
  context.onCleanup(hub.value.subscribe(() => setCurrentProviders(hub.value.providers())))
  const providers = reactiveProviders(currentProviders)
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
