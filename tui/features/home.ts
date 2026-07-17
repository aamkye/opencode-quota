import type { HomeQuotaSummary } from "../providers/types.js";

export function formatHomeQuotaLine(summary: HomeQuotaSummary): string {
  const secondary = typeof summary.secondaryPct === "number" ? `/${Math.round(summary.secondaryPct)}%` : "";
  return `${summary.provider}: ${summary.plan}; ${Math.round(summary.primaryPct)}%${secondary}`;
}

export function homeQuotaPercentParts(summary: HomeQuotaSummary): { text: string; pct: number }[] {
  const parts = [{ text: `${Math.round(summary.primaryPct)}%`, pct: summary.primaryPct }];
  if (typeof summary.secondaryPct === "number") {
    parts.push({ text: `${Math.round(summary.secondaryPct)}%`, pct: summary.secondaryPct });
  }
  return parts;
}

export function homeQuotaStatusRole(remainingPct: number): "error" | "warning" | "success" {
  return remainingPct <= 10 ? "error" : remainingPct <= 30 ? "warning" : "success";
}
