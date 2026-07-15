import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const fixture = (name) => readFileSync(`tests/fixtures/opencode-go/${name}`, "utf8")
const manifest = () => JSON.parse(fixture("request-manifest.json"))
const html = () => fixture("success.html")

const EXPECTED = {
  rollingUsage: { usagePercent: 12.5, resetInSec: 1800 },
  weeklyUsage: { usagePercent: 34, resetInSec: 172800 },
  monthlyUsage: { usagePercent: 56.75, resetInSec: 1209600 },
}

const RECORDS = [
  { name: "rollingUsage", syntheticIndex: 0 },
  { name: "weeklyUsage", syntheticIndex: 1 },
  { name: "monthlyUsage", syntheticIndex: 2 },
]
const NUMBER_SOURCE = String.raw`-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?`

function assignmentPattern(name, syntheticIndex) {
  return new RegExp(
    String.raw`^${name}:\$R\[${syntheticIndex}\]=\{status:"ok",resetInSec:(?<reset>${NUMBER_SOURCE}),usagePercent:(?<usage>${NUMBER_SOURCE})\}$`,
    "u",
  )
}

function fixtureLines(source) {
  const open = "<script>\n"
  const close = "\n</script>\n"
  assert.equal(source.startsWith(open), true)
  assert.equal(source.endsWith(close), true)
  const lines = source.slice(open.length, -close.length).split("\n")
  assert.equal(lines.length, 3)
  return lines
}

function decodeSyntheticFixture(source) {
  assert.ok(source.length <= 1_000_000)
  const lines = fixtureLines(source)
  const decoded = {}

  for (const [index, { name, syntheticIndex }] of RECORDS.entries()) {
    const matches = lines
      .map((line, lineIndex) => ({ lineIndex, match: assignmentPattern(name, syntheticIndex).exec(line) }))
      .filter((candidate) => candidate.match)
    assert.equal(matches.length, 1, `${name} assignment count`)
    assert.equal(matches[0].lineIndex, index, `${name} assignment order`)
    assert.ok(matches[0].match[0].length <= 4_096)
    const usagePercent = Number(matches[0].match.groups.usage)
    const resetInSec = Number(matches[0].match.groups.reset)
    assert.deepEqual({ usagePercent, resetInSec }, EXPECTED[name])
    decoded[name] = { usagePercent, resetInSec }
  }

  return decoded
}

function wrap(lines) {
  return `<script>\n${lines.join("\n")}\n</script>\n`
}

test("OpenCode Go contract records the fixed authenticated page request", () => {
  assert.deepEqual(manifest().request, {
    method: "GET",
    url: "https://opencode.ai/workspace/wrk_TESTWORKSPACE/go",
    headers: { Accept: "text/html", Cookie: "auth=TOKEN_TEST_ONLY_DO_NOT_USE" },
    redirect: "manual",
    timeoutMs: 20000,
  })
})

test("OpenCode Go contract contains one bounded assignment for every usage record", () => {
  assert.deepEqual(decodeSyntheticFixture(html()), EXPECTED)
})

test("OpenCode Go contract grammar rejects duplicate malformed and trick assignments", () => {
  const lines = fixtureLines(html())
  const replaceUsage = (replacement) => lines[0].replace(/(usagePercent:)12\.5/, `$1${replacement}`)
  const invalid = [
    wrap([lines[0], lines[0], lines[1], lines[2]]),
    wrap([lines[1], lines[0], lines[2]]),
    wrap([lines[0].replace("={", "=/* hidden */{"), lines[1], lines[2]]),
    wrap([lines[0].replace("={", "={/* hidden */"), lines[1], lines[2]]),
    wrap([`"${lines[0]}"`, lines[1], lines[2]]),
    wrap([replaceUsage("{ value: 12.5 }"), lines[1], lines[2]]),
    wrap([replaceUsage("\"12.5\""), lines[1], lines[2]]),
    wrap([lines[0].replace('status:"ok"', 'status:"other"'), lines[1], lines[2]]),
    wrap([lines[0].replace("}", ",otherField:1}"), lines[1], lines[2]]),
    wrap([lines[0].replace("}", ",__proto__:null}"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[x]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[-1]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[\"0\"]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[ 0 ]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R [0]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[9]"), lines[1], lines[2]]),
    `<div>${lines[0]}</div>\n`,
  ]
  for (const source of invalid) assert.throws(() => decodeSyntheticFixture(source))
})

test("OpenCode Go contract contains only synthetic identity and usage data", () => {
  const committed = `${fixture("request-manifest.json")}\n${html()}\n${fixture("login-redirect.json")}`
  assert.doesNotMatch(committed, /(?:@|bearer|set-cookie|authorization)/i)
  const workspaces = [...committed.matchAll(/wrk_[A-Za-z0-9]+/g)].map(([value]) => value)
  assert.ok(workspaces.length > 0)
  assert.ok(workspaces.every((value) => value === "wrk_TESTWORKSPACE"))
  assert.equal(committed.includes("TOKEN_TEST_ONLY_DO_NOT_USE"), true)
})

test("OpenCode Go contract records manual same-origin login redirection", () => {
  assert.deepEqual(JSON.parse(fixture("login-redirect.json")), {
    status: 302,
    location: "/auth/authorize",
  })
})
