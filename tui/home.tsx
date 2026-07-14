import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { For, Show } from "solid-js"

import {
  createOpenAiProvider,
  createZaiProvider,
  type HomeQuotaSummary,
  type QuotaProviderAdapter,
} from "../shared/opencode-tools-shared.js"

const HOME_ORDER = 110

export function formatHomeQuotaLine(summary: HomeQuotaSummary): string {
  const secondary = typeof summary.secondaryPct === "number" ? `/${Math.round(summary.secondaryPct)}%` : ""
  return `${summary.provider}: ${summary.plan}; ${Math.round(summary.primaryPct)}%${secondary}`
}

export function homeQuotaPercentParts(summary: HomeQuotaSummary): { text: string; pct: number }[] {
  const parts = [{ text: `${Math.round(summary.primaryPct)}%`, pct: summary.primaryPct }]
  if (typeof summary.secondaryPct === "number") parts.push({ text: `${Math.round(summary.secondaryPct)}%`, pct: summary.secondaryPct })
  return parts
}

function colorForRemaining(remainingPct: number, theme: { error: string; warning: string; success: string }): string {
  return remainingPct <= 10 ? theme.error : remainingPct <= 30 ? theme.warning : theme.success
}

function HomeQuotaLine(props: { summary: HomeQuotaSummary; theme: () => { error: string; warning: string; success: string; textMuted: string } }) {
  const primary = () => `${Math.round(props.summary.primaryPct)}%`
  const secondary = () => typeof props.summary.secondaryPct === "number" ? `${Math.round(props.summary.secondaryPct)}%` : undefined

  return (
    <box flexDirection="row" justifyContent="center">
      <text fg={props.theme().textMuted}>{props.summary.provider}: {props.summary.plan}; </text>
      <text fg={colorForRemaining(props.summary.primaryPct, props.theme())}>{primary()}</text>
      <Show when={secondary()}>
        {(value) => <><text fg={props.theme().textMuted}>/</text><text fg={colorForRemaining(props.summary.secondaryPct!, props.theme())}>{value()}</text></>}
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  const providers: QuotaProviderAdapter[] = [createZaiProvider(api), createOpenAiProvider(api)]

  api.slots.register({
    // A distinct home slot preserves the compact provider summaries during initial loading.
    order: HOME_ORDER,
    slots: {
      home_bottom() {
        return (
          <box flexDirection="column">
            <For each={providers}>
              {(provider) => <Show when={provider.home()}>{(item) => <HomeQuotaLine summary={item()} theme={() => api.theme.current} />}</Show>}
            </For>
          </box>
        )
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "aamkye/opencode-tools-home",
  tui,
}

export default plugin
