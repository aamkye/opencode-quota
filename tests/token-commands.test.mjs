import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const source = readFileSync("lib/tokens/token-commands.ts", "utf-8")
const dataSource = existsSync("lib/tokens/token-report-data.ts")
  ? readFileSync("lib/tokens/token-report-data.ts", "utf-8")
  : ""
const presenterSource = existsSync("lib/tokens/token-report-presenter.ts")
  ? readFileSync("lib/tokens/token-report-presenter.ts", "utf-8")
  : ""

test("defines all 8 token report command specs", () => {
  for (const id of [
    "tokens_today", "tokens_daily", "tokens_weekly", "tokens_monthly",
    "tokens_all", "tokens_session", "tokens_session_all", "tokens_between",
  ]) {
    assert.ok(source.includes(`id: "${id}"`), `missing command spec: ${id}`)
  }
})

test("isTokenReportCommand is exported", () => {
  assert.ok(source.includes("export function isTokenReportCommand"))
})

test("semantic computation and markdown presentation are separate", () => {
  assert.ok(dataSource.includes("export async function computeTokenReport"))
  assert.ok(dataSource.includes("Promise<TokenReportData>"))
  assert.doesNotMatch(dataSource, /formatQuotaStatsReport|renderCommandHeading/)
  assert.ok(presenterSource.includes("export function renderTokenReport"))
  assert.match(presenterSource, /formatQuotaStatsReport/)
  assert.doesNotMatch(source, /aggregateUsage|resolveSessionTree|formatQuotaStatsReport/)
})
