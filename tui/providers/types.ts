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

export type HomeQuotaSummary = ZaiHomeQuotaSummary | OpenAiHomeQuotaSummary

export type ProviderFreshness = "loading" | "ready" | "stale" | "unavailable"

export interface QuotaProviderAdapter {
  id: string
  order: number
  panel: Accessor<PanelModel>
  home: Accessor<HomeQuotaSummary | null>
  freshness: Accessor<ProviderFreshness>
  refresh(): Promise<void>
  setSessionID(sessionID: string): void
}
