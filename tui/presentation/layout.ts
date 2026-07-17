export type HeaderAllocation = {
  marker: number
  label: number
  beforeSummaryGap: number
  summary: number
}

export type ProgressRowAllocation = {
  marker: number
  beforeBarGap: number
  bar: number
  beforePercentGap: number
  percent: number
}

export type CompactTableAllocation = {
  identity: number
  beforeKeyGap: number
  key: number
  beforeValueGap: number
  value: number
  valueAlign: "right"
}

export type StatusRowAllocation = {
  bullet: number
  name: number
  beforeLabelGap: number
  label: number
}

export function allocateHeader(availableCells: number, _label: string, summary?: string): HeaderAllocation {
  const available = Math.max(0, Math.floor(availableCells))
  const marker = Math.min(2, available)
  const remaining = available - marker
  const summaryWidth = Math.min(summary?.length ?? 0, remaining)
  const beforeSummaryGap = summaryWidth > 0 && remaining > summaryWidth ? 1 : 0
  const labelWidth = Math.max(0, remaining - beforeSummaryGap - summaryWidth)

  return {
    marker,
    label: labelWidth,
    beforeSummaryGap,
    summary: summaryWidth,
  }
}

export function allocateProgressRow(availableCells: number): ProgressRowAllocation {
  const available = Math.max(0, Math.floor(availableCells))
  const marker = 3
  const beforeBarGap = 0
  const percent = 4
  const beforePercentGap = 1
  const bar = Math.max(0, available - marker - beforeBarGap - beforePercentGap - percent)

  return { marker, beforeBarGap, bar, beforePercentGap, percent }
}

export function allocateStatusRow(availableCells: number, labelLength: number): StatusRowAllocation {
  const available = Number.isFinite(availableCells) ? Math.max(0, Math.floor(availableCells)) : 0
  const desiredLabel = Number.isFinite(labelLength) ? Math.max(0, Math.floor(labelLength)) : 0
  const label = Math.min(desiredLabel, available)
  const afterLabel = available - label
  const beforeLabelGap = Math.min(1, afterLabel)
  const afterLabelGap = afterLabel - beforeLabelGap
  const bullet = Math.min(2, afterLabelGap)
  const name = afterLabelGap - bullet

  return { bullet, name, beforeLabelGap, label }
}

export function allocateCompactTable(
  availableCells: number,
  columns: { identity?: number; key: number; value: number },
): CompactTableAllocation {
  const available = Math.max(0, Math.floor(availableCells))
  const desiredIdentity = Math.max(0, Math.floor(columns.identity ?? 0))
  const desiredKey = Math.max(0, Math.floor(columns.key))
  const desiredValue = Math.max(0, Math.floor(columns.value))
  const desiredTotal = desiredIdentity + desiredKey + desiredValue + (desiredIdentity > 0 ? 2 : 1)
  const showIdentity = desiredIdentity > 0 && available >= desiredTotal
  const value = Math.min(desiredValue, available)
  const afterValue = available - value
  const identity = showIdentity ? Math.min(desiredIdentity, afterValue) : 0
  const afterIdentity = afterValue - identity
  const beforeKeyGap = identity > 0 && afterIdentity > 0 ? 1 : 0
  const afterKeyGap = afterIdentity - beforeKeyGap
  const beforeValueGap = afterKeyGap > 0 ? 1 : 0
  const key = Math.min(desiredKey, Math.max(0, afterKeyGap - beforeValueGap))

  return { identity, beforeKeyGap, key, beforeValueGap, value, valueAlign: "right" }
}
