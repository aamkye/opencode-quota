import type { Accessor } from "solid-js"

import type { PanelModel } from "../presentation/types.js"

export type ZaiHomeQuotaSummary = {
  provider: "Z.AI"
  plan: string
  primaryPct: number
  secondaryPct?: number
}

export type OpenAiHomeQuotaSummary = {
  provider: "OpenAI"
  plan: string
  primaryPct: number
  secondaryPct?: number
}

export type OpenCodeGoHomeQuotaSummary = {
  provider: "OpenCode GO"
  plan: "Subscription"
  primaryPct: number
  secondaryPct: number
}

export type HomeQuotaSummary =
  | ZaiHomeQuotaSummary
  | OpenAiHomeQuotaSummary
  | OpenCodeGoHomeQuotaSummary

export type ProviderFreshness = "loading" | "ready" | "stale" | "unavailable"

export type QuotaProviderOptions = {
  refreshIntervalMs?: number
  hideTools?: boolean
}

export interface QuotaProviderAdapter {
  id: string
  order: number
  panel: Accessor<PanelModel>
  home: Accessor<HomeQuotaSummary | null>
  quotaSummary?: Accessor<HomeQuotaSummary | null>
  configured: Accessor<boolean>
  freshness: Accessor<ProviderFreshness>
  refresh(): Promise<void>
  setSessionID(sessionID: string): void
  dispose(): void
}
