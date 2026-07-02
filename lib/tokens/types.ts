import type { QuotaFormatStyle } from "./quota-format-style";

export type CursorQuotaPlan = "none" | "pro" | "pro-plus" | "ultra";
export type PricingSnapshotSource = "auto" | "bundled" | "runtime";
export type PercentDisplayMode = "remaining" | "used";

export const REQUEST_TIMEOUT_MS = 5000;
