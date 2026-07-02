import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const source = readFileSync("lib/tokens/token-commands.ts", "utf-8")

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

test("buildTokenReport is exported", () => {
  assert.ok(source.includes("export async function buildTokenReport"))
})
