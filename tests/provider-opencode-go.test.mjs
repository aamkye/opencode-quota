import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const providerModule = await import("../.tmp-test/provider-opencode-go.mjs")
const fixture = (name) => readFileSync(`tests/fixtures/opencode-go/${name}`, "utf8")
const manifest = JSON.parse(fixture("request-manifest.json"))
const now = Date.UTC(2026, 6, 14, 12, 0, 0)
const {
  fetchOpenCodeGoQuota,
  normalizeOpenCodeGoConfig,
  parseOpenCodeGoHydration,
} = providerModule
const sentinel = {
  workspaceId: "wrk_TESTWORKSPACE",
  workspaceToken: "TOKEN_TEST_ONLY_DO_NOT_USE",
}
const expectedQuota = {
  fiveHour: { usedPct: 12.5, remainingPct: 87.5, resetEpoch: now + 1_800_000 },
  weekly: { usedPct: 34, remainingPct: 66, resetEpoch: now + 172_800_000 },
  monthly: { usedPct: 56.75, remainingPct: 43.25, resetEpoch: now + 1_209_600_000 },
}

test("OpenCode Go options normalize valid credentials without diagnostics", () => {
  const diagnostics = []
  const original = console.error
  console.error = (...args) => diagnostics.push(args)
  try {
    const config = normalizeOpenCodeGoConfig({
      workspaceId: ` ${sentinel.workspaceId} `,
      workspaceToken: ` ${sentinel.workspaceToken} `,
    })
    assert.deepEqual(config, sentinel)
    assert.equal(Object.isFrozen(config), true)
    assert.deepEqual(Object.keys(config), ["workspaceId", "workspaceToken"])
    assert.deepEqual(diagnostics, [])
  } finally {
    console.error = original
  }
})

test("OpenCode Go options reject invalid credentials without secret-derived output", () => {
  const diagnostics = []
  const errors = []
  const original = console.error
  console.error = (...args) => diagnostics.push(args)
  try {
    for (const value of [
      undefined,
      null,
      [],
      {},
      { workspaceId: "workspace", workspaceToken: sentinel.workspaceToken },
      { workspaceId: sentinel.workspaceId, workspaceToken: "" },
      { workspaceId: sentinel.workspaceId, workspaceToken: "   " },
      { workspaceId: sentinel.workspaceId, workspaceToken: "x\rX-Test: leaked" },
      { workspaceId: sentinel.workspaceId, workspaceToken: "x\nX-Test: leaked" },
    ]) {
      try {
        assert.equal(normalizeOpenCodeGoConfig(value), null)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error))
      }
    }
  } finally {
    console.error = original
  }
  const serialized = JSON.stringify({ diagnostics, errors })
  assert.deepEqual(errors, [])
  for (const secret of Object.values(sentinel)) assert.equal(serialized.includes(secret), false)
})

test("OpenCode Go options expose no redirectable transport control", () => {
  const source = readFileSync("tui/providers/opencode-go.ts", "utf8")
  for (const forbidden of ["origin?:", "url?:", "headers?:", "cookie?:"]) {
    assert.equal(source.includes(forbidden), false)
  }
})

test("OpenCode Go parser decodes the three confirmed flat hydration records atomically", () => {
  const source = fixture("success.html")
  assert.deepEqual(parseOpenCodeGoHydration(source, now), expectedQuota)
  assert.deepEqual(parseOpenCodeGoHydration(
    source.replace("$R[0]", "$R[17]").replace("$R[1]", "$R[203]").replace("$R[2]", "$R[9]"),
    now,
  ), expectedQuota)
  const reordered = `<script>\n${source.slice(8, -11).split("\n").reverse().join("\n")}\n</script>\n`
  assert.deepEqual(parseOpenCodeGoHydration(reordered, now), expectedQuota)
  assert.deepEqual(parseOpenCodeGoHydration(`${source}<script>const metadata={monthlyUsage:null}</script>`, now), expectedQuota)
})

test("OpenCode Go parser rejects malformed duplicate trick and oversized records without partial data", () => {
  const valid = fixture("success.html")
  const rolling = 'rollingUsage:$R[0]={status:"ok",resetInSec:1800,usagePercent:12.5}'
  const invalid = [
    valid.replace(`${rolling}\n`, ""),
    valid.replace(rolling, `${rolling}\n${rolling}`),
    valid.replace(rolling, `${rolling}\nrollingUsage:$R[x]={status:"ok",resetInSec:1,usagePercent:1}`),
    ...["$R[x]", "$R[-1]", '$R["0"]', "$R[ 0 ]", "$R[]", "$R [0]"].map((marker) => valid.replace("$R[0]", marker)),
    valid.replace("usagePercent:12.5", "usagePercent:NaN"),
    valid.replace("usagePercent:12.5", "usagePercent:Infinity"),
    valid.replace("usagePercent:12.5", "usagePercent:1e309"),
    valid.replace("usagePercent:12.5", "usagePercent:-1"),
    valid.replace("usagePercent:12.5", "usagePercent:101"),
    valid.replace("resetInSec:1800", "resetInSec:-1"),
    valid.replace('status:"ok"', 'status:"other"'),
    valid.replace("resetInSec:1800", 'resetInSec:"1800"'),
    valid.replace("={", "=/*comment*/{"),
    valid.replace("={", "={nested:{},"),
    valid.replace("}", ",extra:1}"),
    valid.replace("}", ",__proto__:null}"),
    valid.replace(rolling, `"${rolling}"`),
    `<div>${rolling}</div>`,
    `${valid}${"x".repeat(1_000_001)}`,
    valid.replace("={", `={${"x".repeat(4_097)}`),
  ]
  for (const source of invalid) {
    const before = source
    assert.equal(parseOpenCodeGoHydration(source, now), null)
    assert.equal(source, before)
  }
})

const fixtureScript = fixture("success.html").trimEnd()
const recordLines = fixtureScript
  .slice("<script>\n".length, -"\n</script>".length)
  .split("\n")
const [rollingRecord, weeklyRecord, monthlyRecord] = recordLines
const script = (...lines) => `<script>\n${lines.join("\n")}\n</script>`
const rawTextNames = ["textarea", "title", "style", "xmp", "iframe", "noembed", "noframes"]
const rollingObject = rollingRecord.slice(rollingRecord.indexOf("=") + 1)

test("OpenCode Go parser ignores unique records in visible comment attribute and raw-text HTML contexts", () => {
  const hiddenRollingContexts = [
    `<div>${rollingRecord};</div>`,
    `<!-- <script>${rollingRecord};</script> -->`,
    `<div data-record='<script>${rollingRecord};</script>'></div>`,
    ...rawTextNames.map((name) => `<${name}><script>${rollingRecord};</script></${name}>`),
  ]
  for (const hidden of hiddenRollingContexts) {
    assert.equal(parseOpenCodeGoHydration(`${hidden}\n${script(weeklyRecord, monthlyRecord)}`, now), null)
  }
})

test("OpenCode Go parser rejects pages whose three records exist only outside actual scripts", () => {
  const allRecords = recordLines.map((line) => `${line};`).join("\n")
  for (const source of [
    `<!-- <script>${allRecords}</script> -->`,
    `<div data-record='<script>${allRecords}</script>'></div>`,
    `<textarea><script>${allRecords}</script></textarea>`,
  ]) assert.equal(parseOpenCodeGoHydration(source, now), null)
})

test("OpenCode Go parser ignores markers in JavaScript strings templates and comments", () => {
  const hiddenRollingContexts = [
    `'${rollingRecord};';`,
    `${JSON.stringify(`${rollingRecord};`)};`,
    `\`${rollingRecord};\`;`,
    `// ${rollingRecord};`,
    `/* ${rollingRecord}; */`,
  ]
  for (const hidden of hiddenRollingContexts) {
    assert.equal(parseOpenCodeGoHydration(script(hidden, weeklyRecord, monthlyRecord), now), null)
  }
})

test("OpenCode Go parser accepts actual code markers while ignored JavaScript contexts contain duplicates", () => {
  const source = script(
    rollingRecord,
    weeklyRecord,
    monthlyRecord,
    `'${rollingRecord};';`,
    `${JSON.stringify(`${weeklyRecord};`)};`,
    `\`${monthlyRecord};\`;`,
    `// ${rollingRecord};`,
    `/* ${weeklyRecord}; */`,
  )
  assert.deepEqual(parseOpenCodeGoHydration(source, now), expectedQuota)
})

test("OpenCode Go parser fails closed on malformed HTML and unclosed JavaScript lexical state", () => {
  const malformedHtml = [
    `<!-- ${fixtureScript}`,
    `<div data-record='${fixtureScript}`,
    ...rawTextNames.map((name) => `<${name}>${fixtureScript}`),
    fixtureScript.replace("</script>", ""),
  ]
  const malformedJavaScript = [
    script(...recordLines, "const value='unterminated"),
    script(...recordLines, 'const value="unterminated'),
    script(...recordLines, "const value=`unterminated"),
    script(...recordLines, "/* unterminated"),
  ]
  for (const source of [...malformedHtml, ...malformedJavaScript]) {
    assert.equal(parseOpenCodeGoHydration(source, now), null)
  }
})

test("OpenCode Go parser scopes slash and template-expression ambiguity to marker-bearing remainders", () => {
  const unrelatedBodies = [
    "const ratio=1/2",
    "const pattern=/safe/",
    "const text=`before ${answer}`",
  ]
  for (const unrelated of unrelatedBodies) {
    assert.deepEqual(parseOpenCodeGoHydration(`${script(unrelated)}\n${fixtureScript}`, now), expectedQuota)
  }

  assert.deepEqual(parseOpenCodeGoHydration(script("const ratio=1/2", ...recordLines), now), expectedQuota)
  assert.deepEqual(parseOpenCodeGoHydration(script("const pattern=/safe/", ...recordLines), now), expectedQuota)
  assert.deepEqual(parseOpenCodeGoHydration(script(...recordLines, "const text=`before ${answer}`"), now), expectedQuota)

  for (const ambiguousLine of [
    `const ratio=1/2; ${rollingRecord};`,
    `const pattern=/safe/; ${rollingRecord};`,
  ]) {
    assert.equal(parseOpenCodeGoHydration(script(weeklyRecord, monthlyRecord, ambiguousLine), now), null)
  }
  assert.equal(parseOpenCodeGoHydration(
    script(weeklyRecord, monthlyRecord, "const text=`before ${answer}`", rollingRecord),
    now,
  ), null)
  assert.equal(parseOpenCodeGoHydration(
    script(weeklyRecord, monthlyRecord, "const text=`before ${answer}`", `'${rollingRecord};';`),
    now,
  ), null)
})

test("OpenCode Go parser validates suffixes against the real script-body remainder", () => {
  const source = fixtureScript.replace(rollingRecord, `${rollingRecord}${" ".repeat(64)}x`)
  assert.equal(parseOpenCodeGoHydration(source, now), null)
})

test("OpenCode Go parser enforces exact HTML and record code-unit boundaries", () => {
  const htmlAtLimit = fixtureScript.padEnd(1_000_000, " ")
  assert.equal(htmlAtLimit.length, 1_000_000)
  assert.deepEqual(parseOpenCodeGoHydration(htmlAtLimit, now), expectedQuota)
  assert.equal(parseOpenCodeGoHydration(`${htmlAtLimit} `, now), null)

  const objectAtLength = (length) => {
    const prefix = '{status:"ok",resetInSec:0.'
    const suffix = ",usagePercent:12.5}"
    const zeros = length - prefix.length - suffix.length
    assert.ok(zeros > 0)
    return `${prefix}${"0".repeat(zeros)}${suffix}`
  }
  const exactObject = objectAtLength(4_096)
  const oversizedObject = objectAtLength(4_097)
  assert.equal(exactObject.length, 4_096)
  assert.equal(oversizedObject.length, 4_097)
  assert.deepEqual(
    parseOpenCodeGoHydration(fixtureScript.replace(rollingObject, exactObject), now),
    { ...expectedQuota, fiveHour: { usedPct: 12.5, remainingPct: 87.5, resetEpoch: now } },
  )
  assert.equal(parseOpenCodeGoHydration(fixtureScript.replace(rollingObject, oversizedObject), now), null)
})

const config = normalizeOpenCodeGoConfig(sentinel)
const signal = new AbortController().signal
const response = (status, body = "", headers = {}) => new Response(status === 204 ? null : body, { status, headers })

async function transportWith(result) {
  const calls = []
  const value = await fetchOpenCodeGoQuota(config, signal, {
    now: () => now,
    fetch: async (...args) => {
      calls.push(args)
      if (result instanceof Error) throw result
      return result
    },
  })
  return { calls, value }
}

test("OpenCode Go transport sends the exact fixed-origin manual request", async () => {
  const { calls, value } = await transportWith(response(200, fixture("success.html"), {
    "content-type": "text/html; charset=utf-8",
  }))
  assert.deepEqual(value, { kind: "success", data: expectedQuota })
  assert.deepEqual(calls, [[manifest.request.url, {
    method: "GET",
    headers: manifest.request.headers,
    redirect: "manual",
    signal,
  }]])
})

test("OpenCode Go transport classifies authentication transient and invalid responses", async () => {
  for (const status of [401, 403]) {
    assert.deepEqual((await transportWith(response(status))).value, { kind: "authentication-required" })
  }
  for (const location of ["/login", "/auth/authorize"]) {
    assert.deepEqual((await transportWith(response(302, "", { location }))).value, { kind: "authentication-required" })
  }
  for (const status of [408, 429, 500, 503, 599]) {
    assert.deepEqual((await transportWith(response(status))).value, { kind: "transient-failure" })
  }
  assert.deepEqual((await transportWith(new Error("TOKEN_TEST_ONLY_DO_NOT_USE"))).value, { kind: "transient-failure" })
  for (const value of [
    response(200, fixture("success.html"), { "content-type": "application/json" }),
    response(200, "<html>missing records</html>", { "content-type": "text/html" }),
    response(204),
    response(302, "", { location: "https://example.com/login" }),
    response(302, "", { location: "/workspace" }),
    response(404),
  ]) assert.deepEqual((await transportWith(value)).value, { kind: "invalid-response" })
})

test("OpenCode Go transport handles body failures without reading redirect bodies", async () => {
  const bodyFailure = {
    status: 200,
    headers: new Headers({ "content-type": "text/html" }),
    text: async () => { throw new Error("body failed") },
  }
  assert.deepEqual((await transportWith(bodyFailure)).value, { kind: "transient-failure" })

  let reads = 0
  const redirect = {
    status: 302,
    headers: new Headers({ location: "/auth/authorize" }),
    text: async () => { reads += 1; return "static synthetic redirect body" },
  }
  assert.deepEqual((await transportWith(redirect)).value, { kind: "authentication-required" })
  assert.equal(reads, 0)
})

test("OpenCode Go transport emits static secret-safe results and never follows redirects", async () => {
  const diagnostics = []
  const original = console.error
  console.error = (...args) => diagnostics.push(args)
  try {
    const results = [
      (await transportWith(new Error(sentinel.workspaceToken))).value,
      (await transportWith(response(403))).value,
      (await transportWith(response(200, sentinel.workspaceId, { "content-type": "text/html" }))).value,
    ]
    const serialized = JSON.stringify({ results, diagnostics })
    for (const secret of Object.values(sentinel)) assert.equal(serialized.includes(secret), false)
  } finally {
    console.error = original
  }
})
