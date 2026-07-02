export const SINGLE_WINDOW_PER_PROVIDER_FORMAT_STYLE = "singleWindow" as const;
export const ALL_WINDOWS_FORMAT_STYLE = "allWindows" as const;
export const DEFAULT_QUOTA_FORMAT_STYLE = SINGLE_WINDOW_PER_PROVIDER_FORMAT_STYLE;

export type CanonicalQuotaFormatStyle =
  | typeof SINGLE_WINDOW_PER_PROVIDER_FORMAT_STYLE
  | typeof ALL_WINDOWS_FORMAT_STYLE;

export type QuotaFormatStyle = CanonicalQuotaFormatStyle | "classic" | "grouped";
