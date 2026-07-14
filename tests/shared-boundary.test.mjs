import assert from "node:assert/strict"
import { existsSync, mkdirSync, readFileSync } from "node:fs"
import test from "node:test"

import { build } from "esbuild"

const sharedPath = "shared/opencode-tools-shared.ts"
const dataPath = "lib/tokens/token-report-data.ts"
const presenterPath = "lib/tokens/token-report-presenter.ts"

function source(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : ""
}

test("loadable quota and token entries use the shared facade for computation", () => {
  const quota = source("tui/quota.tsx")
  const home = source("tui/home.tsx")
  const tokens = source("opencode-tools-tokens.ts")

  assert.match(quota, /from ["']\.\.\/shared\/opencode-tools-shared\.js["']/)
  assert.match(home, /from ["']\.\.\/shared\/opencode-tools-shared\.js["']/)
  assert.match(tokens, /from ["']\.\/shared\/opencode-tools-shared(?:\.js)?["']/)
  assert.doesNotMatch(`${quota}\n${home}`, /from ["']\.\/providers\//)
  assert.doesNotMatch(tokens, /from ["']\.\/lib\/tokens\/(?:token-report-data|token-commands|quota-stats|opencode-storage|modelsdev-pricing)/)
})

test("shared facade exports computation without plugin registration or JSX", () => {
  const shared = source(sharedPath)

  assert.ok(shared, `missing ${sharedPath}`)
  assert.match(shared, /createZaiProvider/)
  assert.match(shared, /createOpenAiProvider/)
  assert.match(shared, /computeTokenReport/)
  assert.doesNotMatch(shared, /@opentui\/|slots\.register|export\s+default|<[a-z][^>]*>/i)
})

test("token computation returns semantic data and presentation preserves markdown", async () => {
  assert.ok(existsSync(dataPath), `missing ${dataPath}`)
  assert.ok(existsSync(presenterPath), `missing ${presenterPath}`)

  mkdirSync(".tmp-test", { recursive: true })
  await build({
    bundle: true,
    entryPoints: [dataPath],
    external: ["bun:sqlite", "better-sqlite3"],
    format: "esm",
    outfile: ".tmp-test/token-report-data.mjs",
    platform: "node",
    target: "es2022",
  })
  await build({
    bundle: true,
    entryPoints: [presenterPath],
    format: "esm",
    outfile: ".tmp-test/token-report-presenter.mjs",
    platform: "node",
    target: "es2022",
  })

  const { computeTokenReport } = await import("../.tmp-test/token-report-data.mjs")
  const { renderTokenReport } = await import("../.tmp-test/token-report-presenter.mjs")

  const invalid = await computeTokenReport({
    command: "tokens_between",
    arguments: "2026-01-15 2026-01-01",
    generatedAtMs: 1_768_435_200_000,
  })
  assert.deepEqual(invalid, {
    kind: "invalid_arguments",
    command: "tokens_between",
    error: "Ending date (2026-01-01) is before starting date (2026-01-15).",
  })
  assert.equal("markdown" in invalid, false)
  assert.equal(
    renderTokenReport(invalid),
    "Invalid arguments for /tokens_between\n\nEnding date (2026-01-01) is before starting date (2026-01-15).\n\nExpected: /tokens_between YYYY-MM-DD YYYY-MM-DD\nExample: /tokens_between 2026-01-01 2026-01-15",
  )

  const unavailable = await computeTokenReport({
    command: "tokens_session",
    generatedAtMs: 1_768_435_200_000,
  })
  assert.deepEqual(unavailable, {
    kind: "session_lookup_error",
    command: "/tokens_session",
    generatedAtMs: 1_768_435_200_000,
    sessionID: "(none)",
    message: "Session not found: (none)",
    checkedPath: "(none)",
  })
  assert.equal("markdown" in unavailable, false)
  assert.match(renderTokenReport(unavailable), /^# Token report unavailable \(\/tokens_session\) /)
  assert.match(
    renderTokenReport(unavailable),
    /\n\nsession_lookup_error:\n- session_id: \(none\)\n- error: Session not found: \(none\)\n- checked_path: \(none\)$/,
  )

  const emptyBuckets = { input: 0, output: 0, reasoning: 0, cache_read: 0, cache_write: 0 }
  const report = renderTokenReport({
    kind: "report",
    title: "Tokens used (All Time)",
    result: {
      window: {},
      totals: {
        priced: emptyBuckets,
        unknown: emptyBuckets,
        unpriced: emptyBuckets,
        costUsd: 0,
        messageCount: 0,
        sessionCount: 0,
      },
      bySourceProvider: [],
      bySourceModel: [],
      byModel: [],
      bySession: [],
      unknown: [],
      unpriced: [],
    },
    topModels: 12,
    topSessions: 12,
    focusSessionID: "session-1",
    generatedAtMs: 1_768_435_200_000,
  })
  assert.match(report, /^# Tokens used \(All Time\) /)
  assert.match(report, /\| Window\s+\| Msgs\s+\| Sess\s+\| Tok\s+\|\s+Cost\s+\|/)
  assert.match(report, /## Top Sessions\n\n[\s\S]*\(current session not in selected window\)/)
})
