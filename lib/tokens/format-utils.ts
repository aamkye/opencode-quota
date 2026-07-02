type PercentDisplayMode = "remaining" | "used";

export function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function padRight(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  return str + " ".repeat(width - str.length);
}

export function padLeft(str: string, width: number): string {
  if (str.length >= width) return str.slice(str.length - width);
  return " ".repeat(width - str.length) + str;
}

export function bar(percentRemaining: number, width: number): string {
  const p = clampInt(percentRemaining, 0, 100);
  const filled = Math.round((p / 100) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

export function resolveDisplayedPercent(
  percentRemaining: number,
  mode: PercentDisplayMode = "remaining",
): number {
  const remaining = Math.max(0, Math.round(percentRemaining));
  const used = Math.max(0, Math.round(100 - percentRemaining));
  return mode === "used" ? used : remaining;
}

export function formatDisplayedPercentLabel(
  percentRemaining: number,
  mode: PercentDisplayMode = "remaining",
): string {
  const displayedPercent = resolveDisplayedPercent(percentRemaining, mode);
  return `${displayedPercent}% ${mode === "used" ? "used" : "left"}`;
}

export const DISPLAYED_PERCENT_LABEL_WIDTH = "100% used".length;

export function formatTokenCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 10_000) {
    return `${(count / 1_000).toFixed(0)}K`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return String(count);
}

export function fmtUsdAmount(n: number): string {
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

function pad2(n: number): string {
  return String(Math.trunc(n)).padStart(2, "0");
}

export function formatLocalCallTimestamp(atMs?: number): string {
  const safeMs = typeof atMs === "number" && Number.isFinite(atMs) ? atMs : Date.now();
  const d = new Date(safeMs);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function renderCommandHeading(params: { title: string; generatedAtMs?: number }): string {
  return `# ${params.title} ${formatLocalCallTimestamp(params.generatedAtMs)}`;
}

export function abbreviateDisplayedModelName(name: string): string {
  return name.replace(/antigravity/gi, "agy");
}

export function shortenModelName(name: string, maxLen: number): string {
  const abbreviated = abbreviateDisplayedModelName(name);
  if (abbreviated.length <= maxLen) return abbreviated;
  const s = abbreviated.replace(/-thinking$/i, "").replace(/-preview$/i, "");
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + "\u2026";
}

export interface FormatResetCountdownOptions {
  missing?: string;
  compactRounded?: boolean;
}

export function formatResetCountdown(iso?: string, opts?: FormatResetCountdownOptions): string {
  if (!iso) return opts?.missing ?? "";
  const resetDate = new Date(iso);
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return "reset";

  const diffMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(diffMinutes / 1440);
  const hours = Math.floor((diffMinutes % 1440) / 60);
  const minutes = diffMinutes % 60;

  if (opts?.compactRounded) {
    if (days > 0) return `${days}d`;
    const halfHours = Math.ceil(diffMinutes / 30);
    const h = Math.floor(halfHours / 2);
    if (h > 0) return halfHours % 2 === 1 ? `${h}.5h` : `${h}h`;
    return `0.5h`;
  }

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
}
