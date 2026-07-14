import type { TuiPlugin, TuiPluginApi, TuiPluginModule, TuiPluginOptions } from "@opencode-ai/plugin/tui"
import { createMemo } from "solid-js"

import { PanelRenderer, type PanelTheme } from "./presentation/renderer.js"
import type { PanelItem, PanelModel, PanelStatus } from "./presentation/types.js"
import { sortByOrderThenId } from "./presentation/types.js"
import {
  createOpenAiProvider,
  createZaiProvider,
  type QuotaProviderAdapter,
} from "../shared/opencode-tools-shared.js"

export type PercentageMode = "remaining" | "used"
export type SortDirection = "desc" | "asc"

export type ProgressColorOptions = {
  enabled?: boolean
  errorBelow?: number
  warningBelow?: number
}

export type QuotaCompositionOptions = {
  percentageMode?: PercentageMode
  sortDirection?: SortDirection
  progressColors?: ProgressColorOptions
}

export type QuotaPluginOptions = {
  refreshIntervalSeconds?: number
  progressColors?: ProgressColorOptions
  otherProviders?: Pick<QuotaCompositionOptions, "percentageMode" | "sortDirection">
}

type NormalizedProgressColors = {
  enabled: boolean
  errorBelow: number
  warningBelow: number
}

type NormalizedCompositionOptions = {
  percentageMode: PercentageMode
  sortDirection: SortDirection
  progressColors: NormalizedProgressColors
}

export type NormalizedQuotaOptions = NormalizedCompositionOptions & {
  refreshIntervalMs: number
}

const SIDEBAR_ORDER = 110
const DEFAULT_PROGRESS_COLORS: NormalizedProgressColors = {
  enabled: true,
  errorBelow: 10,
  warningBelow: 30,
}

const DEFAULT_OPTIONS: NormalizedQuotaOptions = {
  percentageMode: "remaining",
  sortDirection: "desc",
  refreshIntervalMs: 10_000,
  progressColors: DEFAULT_PROGRESS_COLORS,
}
const ADAPTER_ID_BY_PROVIDER_ID: Record<string, string> = {
  "zai-coding-plan": "zai",
  openai: "openai",
  codex: "openai",
  chatgpt: "openai",
  opencode: "openai",
}

function threshold(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : fallback
}

function normalizeProgressColors(value: unknown): NormalizedProgressColors {
  if (!value || typeof value !== "object") return DEFAULT_PROGRESS_COLORS
  const input = value as ProgressColorOptions
  const errorBelow = threshold(input.errorBelow, DEFAULT_PROGRESS_COLORS.errorBelow)
  const warningBelow = threshold(input.warningBelow, DEFAULT_PROGRESS_COLORS.warningBelow)

  return {
    enabled: typeof input.enabled === "boolean" ? input.enabled : true,
    ...(errorBelow <= warningBelow
      ? { errorBelow, warningBelow }
      : {
          errorBelow: DEFAULT_PROGRESS_COLORS.errorBelow,
          warningBelow: DEFAULT_PROGRESS_COLORS.warningBelow,
        }),
  }
}

function compositionOptions(options?: QuotaCompositionOptions): NormalizedCompositionOptions {
  return {
    percentageMode: options?.percentageMode === "used" ? "used" : "remaining",
    sortDirection: options?.sortDirection === "asc" ? "asc" : "desc",
    progressColors: normalizeProgressColors(options?.progressColors),
  }
}

export function normalizeQuotaOptions(value?: TuiPluginOptions): NormalizedQuotaOptions {
  const input = value && typeof value === "object" ? value as QuotaPluginOptions : {}
  const otherProviders = input.otherProviders && typeof input.otherProviders === "object"
    ? input.otherProviders
    : undefined
  const refreshIntervalMs = typeof input.refreshIntervalSeconds === "number"
    && Number.isFinite(input.refreshIntervalSeconds)
    && input.refreshIntervalSeconds > 0
    ? input.refreshIntervalSeconds * 1_000
    : DEFAULT_OPTIONS.refreshIntervalMs

  return {
    ...compositionOptions({ ...otherProviders, progressColors: input.progressColors }),
    refreshIntervalMs,
  }
}

function metric(remainingPct: number, options: NormalizedCompositionOptions): number {
  return options.percentageMode === "used" ? 100 - remainingPct : remainingPct
}

function percentStatus(remainingPct: number, options: NormalizedCompositionOptions): PanelStatus | undefined {
  if (!options.progressColors.enabled) return undefined
  if (remainingPct <= options.progressColors.errorBelow) return "error"
  if (remainingPct <= options.progressColors.warningBelow) return "warning"
  return "success"
}

function windowDuration(label: string): number | null {
  const match = /^(\d+)\s*([HDWM])$/i.exec(label)
  if (!match) return null

  const value = Number(match[1])
  const multiplier = { H: 60, D: 1_440, W: 10_080, M: 43_200 }[match[2]!.toUpperCase()]
  return Number.isFinite(value) && multiplier ? value * multiplier : null
}

type ProviderItemGroup = {
  items: PanelItem[]
  duration: number | null
  sourceIndex: number
}

function providerItemGroups(items: readonly PanelItem[]): { preamble: PanelItem[]; groups: ProviderItemGroup[] } {
  const ordered = [...items]
  const firstProgress = ordered.findIndex((item) => item.kind === "progress")
  if (firstProgress < 0) return { preamble: ordered, groups: [] }

  const preamble = ordered.slice(0, firstProgress)
  const groups: ProviderItemGroup[] = []
  for (const item of ordered.slice(firstProgress)) {
    if (item.kind === "progress") {
      groups.push({
        items: [item],
        duration: windowDuration(item.label),
        sourceIndex: groups.length,
      })
    } else {
      groups.at(-1)!.items.push(item)
    }
  }
  return { preamble, groups }
}

function orderedProviderItems(items: readonly PanelItem[], options: NormalizedCompositionOptions, orderOffset: number): PanelItem[] {
  const { preamble, groups } = providerItemGroups(items)
  const orderedGroups = [...groups].sort((left, right) => {
    if (left.duration !== null && right.duration !== null) return left.duration - right.duration || left.sourceIndex - right.sourceIndex
    if (left.duration !== null) return -1
    if (right.duration !== null) return 1
    return left.sourceIndex - right.sourceIndex
  })

  return [...preamble, ...orderedGroups.flatMap((group) => group.items)]
    .map((item, index) => {
      if (item.kind !== "progress") return { ...item, order: orderOffset + index }
      const { status: _providerStatus, ...progress } = item
      const remainingPct = item.total > 0 ? (item.value / item.total) * 100 : 0
      const status = percentStatus(remainingPct, options)
      const value = options.percentageMode === "used" ? Math.max(0, item.total - item.value) : item.value
      return { ...progress, order: orderOffset + index, value, ...(status ? { status } : {}) }
    })
}

function providerItems(provider: QuotaProviderAdapter, options: NormalizedCompositionOptions, orderOffset: number): PanelItem[] {
  return orderedProviderItems(
    sortByOrderThenId(provider.panel().groups).flatMap((group) => group.items),
    options,
    orderOffset,
  )
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

function summary(provider: QuotaProviderAdapter | undefined, options: NormalizedCompositionOptions) {
  const home = provider?.home()
  if (!home) return undefined

  const primary = metric(home.primaryPct, options)
  const secondary = typeof home.secondaryPct === "number"
    ? `/${Math.round(metric(home.secondaryPct, options))}%`
    : ""
  const status = percentStatus(home.primaryPct, options)
  return {
    kind: "text" as const,
    text: `${Math.round(primary)}%${secondary}`,
    ...(status ? { status } : {}),
  }
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
  const options = normalizeQuotaOptions(rawOptions)
  const providers: QuotaProviderAdapter[] = []
  api.lifecycle.onDispose(() => providers.forEach((provider) => provider.dispose()))
  providers.push(createZaiProvider(api, { refreshIntervalMs: options.refreshIntervalMs }))
  providers.push(createOpenAiProvider(api, { refreshIntervalMs: options.refreshIntervalMs }))
  const model = createMemo(() => composeQuotaPanel(selectedProviderID(api, providers), providers, options))
  const theme = () => api.theme.current as PanelTheme

  api.slots.register({
    // The aggregate owns the sole sidebar slot at the legacy Z.AI registration order.
    order: SIDEBAR_ORDER,
    slots: {
      sidebar_content(_ctx, props) {
        for (const provider of providers) provider.setSessionID(props.session_id ?? "")
        return <PanelRenderer model={model} theme={theme} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "aamkye/opencode-tools",
  tui,
}

export default plugin
