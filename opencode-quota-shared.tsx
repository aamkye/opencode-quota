/** @jsxImportSource @opentui/solid */
import type { Message, Part, TextPart } from "@opencode-ai/sdk/v2"

// ===== Shared constants =====

export const BAR_WIDTH = 28
export const BAR_LABEL_WIDTH = 3
export const API_POLL_MS = 60_000
export const EXHAUSTED_POLL_MS = 300_000
export const TICK_MS = 1000
export const FETCH_TIMEOUT_MS = 20_000
export const STALE_MAX_MS = 10 * 60 * 1000

// ===== Paths =====

export const HOME = process.env.HOME || ""
export const XDG_DATA = process.env.XDG_DATA_HOME || `${HOME}/.local/share`
export const XDG_CONFIG = process.env.XDG_CONFIG_HOME || `${HOME}/.config`

export const CREDENTIAL_FILE_PATHS = [
  `${XDG_DATA}/opencode/auth.json`,
  `${XDG_CONFIG}/opencode/auth.json`,
  `${XDG_CONFIG}/opencode/account.json`,
  `${XDG_DATA}/opencode/account.json`,
]

// ===== Pure helpers =====

export function safeNumber(val: unknown, fallback: number): number {
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

export function clampPct(pct: number): number {
  return Math.min(100, Math.max(0, pct))
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "Resetting..."
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatCount(n: number): string {
  if (n < 1000) return String(Math.round(n))
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`
  return `${(n / 1_000_000).toFixed(1)}M`
}

export function buildBar(percent: number): { filled: string; empty: string } {
  const clamped = clampPct(percent)
  const filled = Math.max(0, Math.min(BAR_WIDTH, Math.round((clamped / 100) * BAR_WIDTH)))
  return {
    filled: "█".repeat(filled),
    empty: "░".repeat(BAR_WIDTH - filled),
  }
}

export function padLabel(label: string, width = BAR_LABEL_WIDTH): string {
  if (label.length >= width) return label
  return label + "\u00A0".repeat(width - label.length)
}

// ===== Theme / colors =====

export interface ThemeLike {
  error: string
  warning: string
  success: string
  text: string
  textMuted: string
}

export interface HomeQuotaSummary {
  provider: "Z.AI" | "OpenAI"
  plan: string
  primaryPct: number
  secondaryPct?: number
}

export function formatPct(pct: number): string {
  return `${clampPct(pct).toFixed(0)}%`
}

export function formatHomeQuotaLine(summary: HomeQuotaSummary): string {
  const secondary = typeof summary.secondaryPct === "number"
    ? `/${formatPct(summary.secondaryPct)}`
    : ""
  return `${summary.provider}: ${summary.plan}; ${formatPct(summary.primaryPct)}${secondary}`
}

export function homeQuotaPercentParts(summary: HomeQuotaSummary): { text: string; pct: number }[] {
  const parts = [{ text: formatPct(summary.primaryPct), pct: summary.primaryPct }]
  if (typeof summary.secondaryPct === "number") {
    parts.push({ text: formatPct(summary.secondaryPct), pct: summary.secondaryPct })
  }
  return parts
}

export function colorForRemaining(remPct: number, theme: ThemeLike): string {
  return remPct <= 10 ? theme.error : remPct <= 30 ? theme.warning : theme.success
}

export function HomeQuotaLine(props: { summary: HomeQuotaSummary; theme: ThemeLike }) {
  return (
    <box flexDirection="row" justifyContent="center">
      <text fg={props.theme.textMuted}>{props.summary.provider}: {props.summary.plan}; </text>
      <text fg={colorForRemaining(props.summary.primaryPct, props.theme)}>{formatPct(props.summary.primaryPct)}</text>
      {typeof props.summary.secondaryPct === "number" ? (
        <>
          <text fg={props.theme.textMuted}>/</text>
          <text fg={colorForRemaining(props.summary.secondaryPct, props.theme)}>{formatPct(props.summary.secondaryPct)}</text>
        </>
      ) : null}
    </box>
  )
}

// ===== Session helpers =====

export function scanMessageParts(
  messages: readonly Message[],
  partReader: (messageID: string) => readonly Part[],
  regex: RegExp,
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (!msg) continue
    const parts = partReader(msg.id)
    for (let j = parts.length - 1; j >= 0; j--) {
      const p = parts[j]
      if (p && p.type === "text") {
        const match = (p as TextPart).text.match(regex)
        if (match) return match[0]
      }
    }
  }
  return null
}

// ===== Shared UI component =====

export function BarRow(props: { label: string; remainingPct: number; theme: ThemeLike }) {
  const color = () => colorForRemaining(props.remainingPct, props.theme)
  const bar = () => buildBar(props.remainingPct)
  const pct = () => `${props.remainingPct.toFixed(0)}%`.padStart(4, " ")
  return (
    <box flexDirection="row" gap={0}>
      <text fg={props.theme.text}>{props.label}</text>
      <text fg={color()}>{" "}{bar().filled}</text>
      {bar().empty ? <text fg={props.theme.textMuted}>{bar().empty}</text> : null}
      <text fg={color()}>{" "}{pct()}</text>
    </box>
  )
}
