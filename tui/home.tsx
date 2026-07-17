import { createSignal, For, Show } from "solid-js"

import {
  acquireQuotaProviderHub,
  defineTuiPlugin,
  homeQuotaPercentParts,
  homeQuotaStatusRole,
  type HomeQuotaSummary,
  pluginDescriptor,
  type QuotaProviderDemand,
  type TuiFeatureContext,
  type QuotaProviderHub,
  type ServiceLease,
  type QuotaProviderAdapter,
} from "../shared/opencode-tools-shared.js"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

const HOME_ORDER = pluginDescriptor("home").slotOrder ?? 0

export const homeProviderHubTestKey = Symbol("home-provider-hub-test")

function acquireHub(
  context: TuiFeatureContext,
  api: TuiPluginApi,
  demand: QuotaProviderDemand,
  meta: unknown,
): ServiceLease<QuotaProviderHub> {
  const injected = meta && typeof meta === "object"
    ? (meta as Record<PropertyKey, unknown>)[homeProviderHubTestKey]
    : undefined
  const acquire = typeof injected === "function"
    ? injected as typeof acquireQuotaProviderHub
    : acquireQuotaProviderHub
  return acquire({ ...context, api }, demand)
}

function HomeQuotaLine(props: { summary: HomeQuotaSummary; theme: () => { error: string; warning: string; success: string; textMuted: string } }) {
  const primary = () => homeQuotaPercentParts(props.summary)[0]
  const secondary = () => homeQuotaPercentParts(props.summary)[1]

  return (
    <box flexDirection="row" justifyContent="center">
      <text fg={props.theme().textMuted}>{props.summary.provider}: {props.summary.plan}; </text>
      <text fg={props.theme()[homeQuotaStatusRole(primary().pct)]}>{primary().text}</text>
      <Show when={secondary()}>
        {(value) => <><text fg={props.theme().textMuted}>/</text><text fg={props.theme()[homeQuotaStatusRole(value().pct)]}>{value().text}</text></>}
      </Show>
    </box>
  )
}

function HomeQuotaLines(props: {
  providers: () => readonly QuotaProviderAdapter[]
  theme: () => { error: string; warning: string; success: string; textMuted: string }
}) {
  return (
    <box flexDirection="column">
      <For each={props.providers()}>
        {(provider) => <Show when={provider.home()}>{(item) => <HomeQuotaLine summary={item()} theme={props.theme} />}</Show>}
      </For>
    </box>
  )
}

const plugin = defineTuiPlugin(pluginDescriptor("home"), (context, api, _options, meta) => {
  const hub = acquireHub(context, api, { consumer: "home" }, meta)
  const [hubProviders, setHubProviders] = createSignal(hub.value.providers())
  context.onCleanup(hub.value.subscribe(() => setHubProviders(hub.value.providers())))
  const providers = (): readonly QuotaProviderAdapter[] => hubProviders()
    .filter((provider) => provider.id === "zai" || provider.id === "openai")

  api.slots.register({
    // A distinct home slot preserves the compact provider summaries during initial loading.
    order: HOME_ORDER,
    slots: {
      home_bottom() {
        return <HomeQuotaLines providers={providers} theme={() => api.theme.current} />
      },
    },
  })
})

export default plugin
