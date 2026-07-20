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
