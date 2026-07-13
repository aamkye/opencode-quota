import type { TimerState } from "./types.js"

type TextAlignment = "left" | "right" | "center" | "start" | "end"

type TimerDisplay = {
  state: TimerState
  epoch?: number
}

function formatCompact(value: number, divisor: number, suffix: string, precision: number): string {
  const compact = value / divisor
  return `${compact.toFixed(precision).replace(/\.0+$/, "")}${suffix}`
}

export function formatCount(value: number, precision = 1): string {
  if (!Number.isFinite(value)) return "0"
  const absolute = Math.abs(value)
  if (absolute >= 1_000_000_000) return formatCompact(value, 1_000_000_000, "B", precision)
  if (absolute >= 1_000_000) return formatCompact(value, 1_000_000, "M", precision)
  if (absolute >= 1_000) return formatCompact(value, 1_000, "K", precision)
  return String(Math.round(value))
}

export function formatBytes(value: number, precision = 1): string {
  if (!Number.isFinite(value)) return "0 B"
  const units = ["B", "KiB", "MiB", "GiB", "TiB"]
  const absolute = Math.abs(value)
  const unitIndex = Math.min(Math.floor(Math.log(Math.max(absolute, 1)) / Math.log(1024)), units.length - 1)
  const scaled = value / 1024 ** unitIndex
  const rendered = unitIndex === 0 ? String(Math.round(scaled)) : scaled.toFixed(precision).replace(/\.0+$/, "")
  return `${rendered} ${units[unitIndex]}`
}

export function formatDuration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds)) return "0s"
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000))
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function formatCurrency(value: number, precision = 2): string {
  if (!Number.isFinite(value)) return "$0.00"
  return `$${value.toFixed(precision)}`
}

export function formatPercent(value: number): string {
  const percent = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0
  return `${percent}%`
}

export function formatTimer(timer: TimerDisplay, now = Date.now()): string {
  switch (timer.state) {
    case "unavailable":
      return "unavailable"
    case "idle":
      return "resets in -"
    case "expired":
      return "reset pending"
    case "countdown":
      {
        const epoch = timer.epoch
        if (typeof epoch !== "number" || !Number.isFinite(epoch)) return "unavailable"
        if (epoch <= now) return "reset pending"
        return `resets in ${formatDuration(epoch - now)}`
      }
  }
}

export function alignText(text: string, width: number, alignment: TextAlignment = "left"): string {
  const available = Math.max(0, Math.floor(width))
  if (text.length >= available) return text
  const padding = available - text.length
  if (alignment === "right" || alignment === "end") return " ".repeat(padding) + text
  if (alignment === "center") {
    const left = Math.floor(padding / 2)
    return " ".repeat(left) + text + " ".repeat(padding - left)
  }
  return text + " ".repeat(padding)
}

export function truncateText(text: string, width: number, marker = "…"): string {
  const available = Math.max(0, Math.floor(width))
  if (text.length <= available) return text
  if (available <= marker.length) return marker.slice(0, available)
  return text.slice(0, available - marker.length) + marker
}
