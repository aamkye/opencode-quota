import assert from "node:assert/strict"
import test from "node:test"

import { formatHomeQuotaLine, homeQuotaPercentParts } from "../.tmp-test/home-composition.mjs"

test("formats two-window homepage quota lines", () => {
  assert.equal(
    formatHomeQuotaLine({ provider: "Z.AI", plan: "Max", primaryPct: 93, secondaryPct: 84 }),
    "Z.AI: Max; 93%/84%",
  )
  assert.equal(
    formatHomeQuotaLine({ provider: "OpenAI", plan: "Pro Lite", primaryPct: 96, secondaryPct: 84 }),
    "OpenAI: Pro Lite; 96%/84%",
  )
})

test("omits slash suffix when secondary quota is missing", () => {
  assert.equal(
    formatHomeQuotaLine({ provider: "OpenAI", plan: "Pro", primaryPct: 96 }),
    "OpenAI: Pro; 96%",
  )
})

test("exposes colorable percentage parts", () => {
  assert.deepEqual(
    homeQuotaPercentParts({ provider: "Z.AI", plan: "Max", primaryPct: 9.6, secondaryPct: 30.1 }),
    [
      { text: "10%", pct: 9.6 },
      { text: "30%", pct: 30.1 },
    ],
  )
})
