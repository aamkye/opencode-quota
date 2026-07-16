import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

import { createOpenAiProvider } from "../providers/openai.js"
import type { OpenCodeGoConfig, OpenCodeGoProviderOptions } from "../providers/opencode-go.js"
import { createOpenCodeGoProvider } from "../providers/opencode-go.js"
import type { QuotaProviderAdapter, QuotaProviderOptions } from "../providers/types.js"
import { createZaiProvider } from "../providers/zai.js"
import type { ServiceLease, TuiFeatureContext } from "../runtime/plugin.js"

const QUOTA_PROVIDER_HUB_SERVICE_KEY = "quota-provider-hub"

export type QuotaProviderDemand = {
  consumer: string
  refreshIntervalMs?: number
  zai?: {
    hideTools?: boolean
  }
  openCodeGo?: {
    config?: OpenCodeGoConfig | null
    refreshIntervalMs?: number
  } | null
}

export interface QuotaProviderHub {
  providers(): readonly QuotaProviderAdapter[]
  addDemand(demand: QuotaProviderDemand): () => void
  dispose(): void
}

type ProviderFactorySet = {
  createZaiProvider(api: TuiPluginApi, options?: QuotaProviderOptions): QuotaProviderAdapter
  createOpenAiProvider(api: TuiPluginApi, options?: QuotaProviderOptions): QuotaProviderAdapter
  createOpenCodeGoProvider(api: TuiPluginApi, options?: OpenCodeGoProviderOptions): QuotaProviderAdapter
}

type ProviderSpec = {
  id: QuotaProviderAdapter["id"]
  key: string
  create(): QuotaProviderAdapter
}

type ProviderRecord = {
  key: string
  adapter: QuotaProviderAdapter
}

type QuotaProviderHubContext = TuiFeatureContext & { api: TuiPluginApi }

function normalizeRefreshInterval(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined
}

function zaiOptions(demand: QuotaProviderDemand): QuotaProviderOptions {
  const options: QuotaProviderOptions = {}
  const refreshIntervalMs = normalizeRefreshInterval(demand.refreshIntervalMs)
  if (refreshIntervalMs !== undefined) options.refreshIntervalMs = refreshIntervalMs
  if (demand.zai && "hideTools" in demand.zai) options.hideTools = demand.zai.hideTools
  return options
}

function openAiOptions(demand: QuotaProviderDemand): QuotaProviderOptions {
  const options: QuotaProviderOptions = {}
  const refreshIntervalMs = normalizeRefreshInterval(demand.refreshIntervalMs)
  if (refreshIntervalMs !== undefined) options.refreshIntervalMs = refreshIntervalMs
  return options
}

function openCodeGoOptions(demand: QuotaProviderDemand): OpenCodeGoProviderOptions | null {
  const config = demand.openCodeGo?.config ?? null
  if (!config) return null
  const options: OpenCodeGoProviderOptions = { config }
  const refreshIntervalMs = normalizeRefreshInterval(demand.openCodeGo?.refreshIntervalMs)
    ?? normalizeRefreshInterval(demand.refreshIntervalMs)
  if (refreshIntervalMs !== undefined) options.refreshIntervalMs = refreshIntervalMs
  return options
}

function providerSpecs(
  api: TuiPluginApi,
  factories: ProviderFactorySet,
  demands: readonly QuotaProviderDemand[],
): ProviderSpec[] {
  const quotaDemands = demands.filter((demand) => demand.consumer === "quota")
  if (quotaDemands.length > 0) {
    const demand = quotaDemands[quotaDemands.length - 1]!
    const zai = zaiOptions(demand)
    const openai = openAiOptions(demand)
    const openCodeGo = openCodeGoOptions(demand)
    const openCodeGoConfig = openCodeGo?.config ?? null
    return [
      {
        id: "zai",
        key: JSON.stringify([zai.refreshIntervalMs ?? null, zai.hideTools ?? null]),
        create: () => factories.createZaiProvider(api, zai),
      },
      {
        id: "openai",
        key: JSON.stringify([openai.refreshIntervalMs ?? null]),
        create: () => factories.createOpenAiProvider(api, openai),
      },
      ...(openCodeGo
        ? [{
            id: "opencode-go",
            key: JSON.stringify([
              openCodeGo.refreshIntervalMs ?? null,
              openCodeGoConfig!.workspaceId,
              openCodeGoConfig!.workspaceToken,
            ]),
            create: () => factories.createOpenCodeGoProvider(api, openCodeGo),
          } satisfies ProviderSpec]
        : []),
    ]
  }

  if (!demands.some((demand) => demand.consumer === "home")) return []
  return [
    {
      id: "zai",
      key: "home",
      create: () => factories.createZaiProvider(api, {}),
    },
    {
      id: "openai",
      key: "home",
      create: () => factories.createOpenAiProvider(api, {}),
    },
  ]
}

export function createQuotaProviderHub(
  api: TuiPluginApi,
  factories: ProviderFactorySet = { createZaiProvider, createOpenAiProvider, createOpenCodeGoProvider },
): QuotaProviderHub {
  const demands = new Map<number, QuotaProviderDemand>()
  let nextDemandToken = 0
  let records = new Map<string, ProviderRecord>()
  let currentProviders: readonly QuotaProviderAdapter[] = []
  let disposed = false

  const reconcile = (): void => {
    if (disposed) return
    const nextRecords = new Map<string, ProviderRecord>()
    const nextProviders: QuotaProviderAdapter[] = []
    for (const spec of providerSpecs(api, factories, [...demands.values()])) {
      const current = records.get(spec.id)
      if (current && current.key === spec.key) {
        nextRecords.set(spec.id, current)
        nextProviders.push(current.adapter)
        continue
      }
      if (current) current.adapter.dispose()
      const adapter = spec.create()
      nextRecords.set(spec.id, { key: spec.key, adapter })
      nextProviders.push(adapter)
    }
    for (const [id, record] of records) {
      if (!nextRecords.has(id)) record.adapter.dispose()
    }
    records = nextRecords
    currentProviders = nextProviders
  }

  return {
    providers() {
      return currentProviders
    },
    addDemand(demand) {
      if (disposed) return () => {}
      const token = nextDemandToken
      nextDemandToken += 1
      demands.set(token, demand)
      reconcile()
      let removed = false
      return () => {
        if (removed || disposed) return
        removed = true
        if (!demands.delete(token)) return
        reconcile()
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      demands.clear()
      for (const record of records.values()) record.adapter.dispose()
      records.clear()
      currentProviders = []
    },
  }
}

export function acquireQuotaProviderHub(
  context: QuotaProviderHubContext,
  demand: QuotaProviderDemand,
): ServiceLease<QuotaProviderHub> {
  const lease = context.acquireService(QUOTA_PROVIDER_HUB_SERVICE_KEY, () => createQuotaProviderHub(context.api))
  const removeDemand = lease.value.addDemand(demand)
  context.onCleanup(removeDemand)
  return lease
}
