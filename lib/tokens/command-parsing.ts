export type Ymd = { y: number; m: number; d: number };

export function parseOptionalJsonArgs(input: string | undefined):
  | {
      ok: true;
      value: Record<string, unknown>;
    }
  | {
      ok: false;
      error: string;
    } {
  const raw = input?.trim() || "";
  if (!raw) return { ok: true, value: {} };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: 'Arguments must be a JSON object (e.g. {"force":true}).' };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: "Failed to parse JSON arguments." };
  }
}

export function parseYyyyMmDd(input: string): Ymd | null {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(input)) return null;
  const [yStr, mStr, dStr] = input.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return { y, m, d };
}

export function startOfLocalDayMs(ymd: Ymd): number {
  return new Date(ymd.y, ymd.m - 1, ymd.d).getTime();
}

export function startOfNextLocalDayMs(ymd: Ymd): number {
  return new Date(ymd.y, ymd.m - 1, ymd.d + 1).getTime();
}

export function parseQuotaBetweenArgs(
  input: string | undefined,
): { ok: true; startYmd: Ymd; endYmd: Ymd } | { ok: false; error: string } {
  const raw = input?.trim() || "";
  if (!raw) {
    return {
      ok: false,
      error: "Missing arguments. Expected two dates in YYYY-MM-DD format.",
    };
  }

  let startStr: string;
  let endStr: string;

  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      startStr = String(parsed["starting_date"] ?? parsed["startingDate"] ?? "");
      endStr = String(parsed["ending_date"] ?? parsed["endingDate"] ?? "");
    } catch {
      return { ok: false, error: "Failed to parse JSON arguments." };
    }
  } else {
    const parts = raw.split(/\s+/);
    if (parts.length !== 2) {
      return {
        ok: false,
        error: "Expected exactly two dates in YYYY-MM-DD format.",
      };
    }
    [startStr, endStr] = parts;
  }

  const startYmd = parseYyyyMmDd(startStr);
  if (!startYmd) {
    return { ok: false, error: `Invalid starting date: "${startStr}". Expected YYYY-MM-DD.` };
  }
  const endYmd = parseYyyyMmDd(endStr);
  if (!endYmd) {
    return { ok: false, error: `Invalid ending date: "${endStr}". Expected YYYY-MM-DD.` };
  }

  const startMs = startOfLocalDayMs(startYmd);
  const endMs = startOfLocalDayMs(endYmd);
  if (endMs < startMs) {
    return {
      ok: false,
      error: `Ending date (${endStr}) is before starting date (${startStr}).`,
    };
  }

  return { ok: true, startYmd, endYmd };
}

export function formatYmd(ymd: Ymd): string {
  const y = String(ymd.y).padStart(4, "0");
  const m = String(ymd.m).padStart(2, "0");
  const d = String(ymd.d).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
