import type { TuiPlugin, TuiPluginApi, TuiPluginModule, TuiPluginOptions } from "@opencode-ai/plugin/tui"
import { createMemo } from "solid-js"

import { PanelRenderer, type PanelTheme } from "./presentation/renderer.js"
import type { PanelItem, PanelModel, PanelStatus } from "./presentation/types.js"
import { sortByOrderThenId } from "./presentation/types.js"
import { createOpenAiProvider } from "./providers/openai.js"
import type { QuotaProviderAdapter } from "./providers/types.js"
import { createZaiProvider } from "./providers/zai.js"

export type PercentageMode = "remaining" | "used"
export type SortDirection = "desc" | "asc"

export type QuotaCompositionOptions = {
  percentageMode?: PercentageMode
  sortDirection?: SortDirection
}

const SIDEBAR_ORDER = 110
const DEFAULT_OPTIONS: Required<QuotaCompositionOptions> = {
  percentageMode: "remaining",
  sortDirection: "desc",
}
const ADAPTER_ID_BY_PROVIDER_ID: Record<string, string> = {
  "zai-coding-plan": "zai",
  openai: "openai",
  codex: "openai",
  chatgpt: "openai",
  opencode: "openai",
}

function compositionOptions(options?: QuotaCompositionOptions): Required<QuotaCompositionOptions> {
  return {
    percentageMode: options?.percentageMode === "used" ? "used" : "remaining",
    sortDirection: options?.sortDirection === "asc" ? "asc" : "desc",
  }
}

function pluginOptions(value: TuiPluginOptions): Required<QuotaCompositionOptions> {
  const otherProviders = value.otherProviders
  if (!otherProviders || typeof otherProviders !== "object") return DEFAULT_OPTIONS
  return compositionOptions(otherProviders as QuotaCompositionOptions)
}

function metric(remainingPct: number, options: Required<QuotaCompositionOptions>): number {
  return options.percentageMode === "used" ? 100 - remainingPct : remainingPct
}

function percentStatus(value: number, options: Required<QuotaCompositionOptions>): PanelStatus {
  const remainingPct = options.percentageMode === "used" ? 100 - value : value
  return remainingPct <= 10 ? "error" : remainingPct <= 30 ? "warning" : "success"
}

function windowDuration(label: string): number | null {
  const match = /^(\d+)\s*([HDWM])$/i.exec(label)
  if (!match) return null

  const value = Number(match[1])
  const multiplier = { H: 60, D: 1_440, W: 10_080, M: 43_200 }[match[2]!.toUpperCase()]
  return Number.isFinite(value) && multiplier ? value * multiplier : null
}

function itemWindowLabel(item: PanelItem): string | null {
  if (item.kind === "progress") return item.label
  if (item.kind === "timer") return item.label.replace(/\s+reset$/i, "")
  return null
}

function orderedProviderItems(items: readonly PanelItem[], options: Required<QuotaCompositionOptions>, orderOffset: number): PanelItem[] {
  return [...items]
    .map((item, index) => {
      const label = itemWindowLabel(item)
      return { item, index, label, duration: label ? windowDuration(label) : null }
    })
    .sort((left, right) => {
      if (left.label !== null && right.label !== null) {
        if (left.duration !== null && right.duration !== null) {
          return left.duration - right.duration
          || (left.item.kind === "progress" ? -1 : 1) - (right.item.kind === "progress" ? -1 : 1)
          || left.index - right.index
        }
        if (left.duration !== null) return -1
        if (right.duration !== null) return 1
        return left.label.localeCompare(right.label)
          || (left.item.kind === "progress" ? -1 : 1) - (right.item.kind === "progress" ? -1 : 1)
          || left.index - right.index
      }
      if (left.label !== null) return 1
      if (right.label !== null) return -1
      return left.item.order - right.item.order || left.item.id.localeCompare(right.item.id)
    })
    .map(({ item }, index) => {
      if (item.kind !== "progress" || options.percentageMode === "remaining") return { ...item, order: orderOffset + index }
      return { ...item, order: orderOffset + index, value: Math.max(0, item.total - item.value) }
    })
}

function providerItems(provider: QuotaProviderAdapter, options: Required<QuotaCompositionOptions>, orderOffset: number): PanelItem[] {
  return sortByOrderThenId(provider.panel().groups)
    .flatMap((group) => orderedProviderItems(group.items, options, orderOffset))
}

function providerPrimaryPct(provider: QuotaProviderAdapter): number | null {
  const home = provider.home()
  if (home) return home.primaryPct

  for (const group of provider.panel().groups) {
    const primary = group.items.find((item) => item.kind === "progress")
    if (primary && primary.total > 0) return (primary.value / primary.total) * 100
  }
  return null
}

function providerName(provider: QuotaProviderAdapter): string {
  return provider.panel().title
}

function summary(provider: QuotaProviderAdapter | undefined, options: Required<QuotaCompositionOptions>) {
  const home = provider?.home()
  if (!home) return undefined

  const primary = metric(home.primaryPct, options)
  const secondary = typeof home.secondaryPct === "number" ? `/${Math.round(metric(home.secondaryPct, options))}%` : ""
  return { kind: "text" as const, text: `${Math.round(primary)}%${secondary}`, status: percentStatus(primary, options) }
}

export function composeQuotaPanel(
  selectedProviderID: string | undefined,
  providers: readonly QuotaProviderAdapter[],
  requestedOptions?: QuotaCompositionOptions,
): PanelModel {
  const options = compositionOptions(requestedOptions)
  const selected = providers.find((provider) => provider.id === selectedProviderID)
  const secondary = providers
    .filter((provider) => provider !== selected && (provider.freshness() === "ready" || provider.freshness() === "stale"))
    .sort((left, right) => {
      const leftMetric = metric(providerPrimaryPct(left) ?? 0, options)
      const rightMetric = metric(providerPrimaryPct(right) ?? 0, options)
      const direction = options.sortDirection === "asc" ? 1 : -1
      return direction * (leftMetric - rightMetric) || providerName(left).localeCompare(providerName(right)) || left.id.localeCompare(right.id)
    })

  const groups = [
    ...(selected
      ? sortByOrderThenId(selected.panel().groups).map((group, index) => ({
          ...group,
          items: orderedProviderItems(group.items, options, index * 1_000),
        }))
      : []),
    ...(secondary.length > 0
      ? [{
          id: "other-providers",
          order: 1_000_000,
          header: { title: "Other providers", collapsible: true },
          items: secondary.flatMap((provider, index) => providerItems(provider, options, index * 1_000)),
        }]
      : []),
  ]

  return {
    id: "quota",
    order: SIDEBAR_ORDER,
    title: "Quota",
    collapsedSummary: summary(selected, options),
    groups,
  }
}

export function selectedQuotaProviderID(
  providerState: readonly { id: string }[],
  providers: readonly QuotaProviderAdapter[],
): string | undefined {
  for (const candidate of providerState) {
    const adapterID = ADAPTER_ID_BY_PROVIDER_ID[candidate.id] ?? candidate.id
    if (providers.some((provider) => provider.id === adapterID)) return adapterID
  }
  return undefined
}

function selectedProviderID(api: TuiPluginApi, providers: readonly QuotaProviderAdapter[]): string | undefined {
  return selectedQuotaProviderID(api.state.provider, providers)
}

const tui: TuiPlugin = async (api, rawOptions) => {
  const providers = [createZaiProvider(api), createOpenAiProvider(api)]
  const options = pluginOptions(rawOptions)
  const model = createMemo(() => composeQuotaPanel(selectedProviderID(api, providers), providers, options))
  const theme = () => api.theme.current as PanelTheme

  api.slots.register({
    // The aggregate owns the sole sidebar slot at the legacy Z.AI registration order.
    order: SIDEBAR_ORDER,
    slots: {
      sidebar_content(_ctx, props) {
        for (const provider of providers) provider.setSessionID(props.session_id ?? "")
        return <PanelRenderer model={model} availableCells={() => 80} theme={theme} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "aamkye/opencode-quota",
  tui,
}

export default plugin
