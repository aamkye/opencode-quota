import assert from "node:assert/strict"
import { existsSync, mkdirSync, readFileSync } from "node:fs"
import test from "node:test"

import { build } from "esbuild"
import ts from "typescript"

const sharedPath = "shared/opencode-tools-shared.ts"
const dataPath = "lib/tokens/token-report-data.ts"
const presenterPath = "lib/tokens/token-report-presenter.ts"
const homeFeaturePath = "tui/features/home.ts"
const tokenFeaturePath = "tui/features/token-report.ts"

function source(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : ""
}

function parsedSource(path) {
  return ts.createSourceFile(path, source(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

function hasNamedReExport(sourceFile, moduleSpecifier, exportName) {
  return sourceFile.statements.some((statement) =>
    ts.isExportDeclaration(statement)
    && !statement.isTypeOnly
    && statement.moduleSpecifier
    && ts.isStringLiteral(statement.moduleSpecifier)
    && statement.moduleSpecifier.text === moduleSpecifier
    && ts.isNamedExports(statement.exportClause)
    && statement.exportClause.elements.some((element) =>
      !element.isTypeOnly
      && element.name.text === exportName
      && (element.propertyName?.text ?? element.name.text) === exportName
    )
  )
}

function namedImportLocalName(sourceFile, moduleSpecifier, importName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)
      || !ts.isStringLiteral(statement.moduleSpecifier)
      || statement.moduleSpecifier.text !== moduleSpecifier
      || statement.importClause?.isTypeOnly
      || !ts.isNamedImports(statement.importClause?.namedBindings)) continue

    const specifier = statement.importClause.namedBindings.elements.find((element) =>
      !element.isTypeOnly && (element.propertyName?.text ?? element.name.text) === importName
    )
    if (specifier) return specifier.name.text
  }
}

function callsIdentifier(sourceFile, name) {
  let found = false
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) found = true
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

function relativeImports(code) {
  return [...code.matchAll(/(?:from\s+|import\s*(?:\(\s*)?|require\s*\(\s*)["'](\.{1,2}\/[^"']+)["']/g)]
    .map((match) => match[1])
}

function assertRelativeImports(path, allowed) {
  const actual = relativeImports(source(path))
  assert.deepEqual(actual.filter((specifier) => !allowed.includes(specifier)), [], `${path} bypasses the shared computation facade`)
}

test("relative import allowlists cover static, side-effect, dynamic, and CommonJS paths", () => {
  assert.deepEqual(relativeImports(`
    import value from "./static.js"
    import "./side-effect.js"
    export { value } from "./exported.js"
    await import("./dynamic.js")
    require("./commonjs.js")
  `), [
    "./static.js",
    "./side-effect.js",
    "./exported.js",
    "./dynamic.js",
    "./commonjs.js",
  ])
})

test("TODO facade syntax checks reject comments and strings", () => {
  const deadText = ts.createSourceFile("dead.tsx", `
    // export { createTodoPanelModel } from "../tui/features/todo.js"
    const text = 'import { createTodoPanelModel } from "../shared/opencode-tools-shared.js"; createTodoPanelModel()'
  `, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  assert.equal(hasNamedReExport(deadText, "../tui/features/todo.js", "createTodoPanelModel"), false)
  assert.equal(namedImportLocalName(deadText, "../shared/opencode-tools-shared.js", "createTodoPanelModel"), undefined)
  assert.equal(callsIdentifier(deadText, "createTodoPanelModel"), false)
})

test("loadable TUI entries use the shared facade for computation", () => {
  const quota = source("tui/quota.tsx")
  const home = source("tui/home.tsx")
  const tokenReport = source("tui/token-report.tsx")
  const mcp = source("tui/mcp.tsx")
  const todo = source("tui/todo.tsx")
  const todoSource = parsedSource("tui/todo.tsx")

  assert.match(quota, /from ["']\.\.\/shared\/opencode-tools-shared\.js["']/)
  assert.match(home, /from ["']\.\.\/shared\/opencode-tools-shared\.js["']/)
  assert.match(tokenReport, /from ["']\.\.\/shared\/opencode-tools-shared\.js["']/)
  assert.match(mcp, /from ["']\.\.\/shared\/opencode-tools-shared\.js["']/)
  const todoModelImport = namedImportLocalName(todoSource, "../shared/opencode-tools-shared.js", "createTodoPanelModel")
  assert.ok(todoModelImport, "tui/todo.tsx must named-import createTodoPanelModel from the shared facade")
  assert.ok(callsIdentifier(todoSource, todoModelImport), "tui/todo.tsx must call the imported createTodoPanelModel")
  assert.match(todo, /from ["']\.\.\/shared\/opencode-tools-shared\.js["']/)
  assertRelativeImports("tui/quota.tsx", [
    "../shared/opencode-tools-shared.js",
    "./presentation/renderer.js",
    "./presentation/types.js",
  ])
  assert.doesNotMatch(quota, /\bSIDEBAR_ORDER\b/)
  assert.doesNotMatch(quota, /Record<string,\s*unknown>/)
  assert.doesNotMatch(quota, /\[["'][^"']+["']\s*\+/)
  assert.doesNotMatch(quota, /\bnormalizeQuotaOptions\b/)
  assert.doesNotMatch(quota, /\bcomposeQuotaPanel\b/)
  assertRelativeImports("tui/home.tsx", ["../shared/opencode-tools-shared.js"])
  assertRelativeImports("tui/token-report.tsx", ["../shared/opencode-tools-shared.js"])
  assertRelativeImports("tui/mcp.tsx", ["../shared/opencode-tools-shared.js"])
  assertRelativeImports("tui/lsp.tsx", ["../shared/opencode-tools-shared.js"])
  assertRelativeImports("tui/todo.tsx", ["../shared/opencode-tools-shared.js"])
  assert.doesNotMatch(tokenReport, /\bcomputeTokenReport\b|\brenderTokenReport\b/)
  assert.doesNotMatch(tokenReport, /client\.session\.prompt/)
  assert.doesNotMatch(tokenReport, /\bhistory\b|\bmodel\b/)
  assert.doesNotMatch(mcp, /\.sort\(|setInterval|setTimeout/)
  assert.doesNotMatch(todo, /todo\.updated|setInterval|setTimeout/)
})

test("shared facade exports computation without plugin registration or JSX", () => {
  const shared = source(sharedPath)
  const sharedSource = parsedSource(sharedPath)
  const quotaFeature = source("tui/features/quota.ts")
  const homeFeature = source(homeFeaturePath)
  const tokenFeature = source(tokenFeaturePath)

  assert.ok(shared, `missing ${sharedPath}`)
  assert.match(shared, /createZaiProvider/)
  assert.match(shared, /createOpenAiProvider/)
  assert.match(shared, /createOpenCodeGoProvider/)
  assert.match(shared, /OpenCodeGoHomeQuotaSummary/)
  assert.match(shared, /composeQuotaPanel/)
  assert.match(shared, /createQuotaSelection/)
  assert.match(shared, /normalizeQuotaOptions/)
  assert.match(shared, /quotaSidebarSlotOrder/)
  assert.match(shared, /quotaAdapterShared/)
  assert.match(shared, /quotaProviderDemand/)
  assert.match(shared, /selectedQuotaProviderID/)
  assert.match(shared, /selectedSessionQuotaProviderID/)
  assert.match(shared, /pluginDescriptor\(["']quota["']\)\.slotOrder/)
  assert.match(shared, /computeTokenReport/)
  assert.match(shared, /renderTokenReport/)
  assert.match(shared, /formatHomeQuotaLine/)
  assert.match(shared, /homeQuotaPercentParts/)
  assert.match(shared, /homeQuotaStatusRole/)
  assert.match(shared, /activeSessionID/)
  assert.match(shared, /persistTokenReport/)
  assert.match(shared, /createLspPanelModel/)
  assert.ok(
    hasNamedReExport(sharedSource, "../tui/features/todo.js", "createTodoPanelModel"),
    "shared facade must re-export createTodoPanelModel from the TODO feature",
  )
  assert.doesNotMatch(shared, /@opentui\/|slots\.register|export\s+default|<[a-z][^>]*>/i)
  assert.match(homeFeature, /export function formatHomeQuotaLine/)
  assert.match(homeFeature, /export function homeQuotaPercentParts/)
  assert.match(homeFeature, /export function homeQuotaStatusRole/)
  assert.match(tokenFeature, /export function activeSessionID/)
  assert.match(tokenFeature, /export async function persistTokenReport/)
  assert.match(tokenFeature, /computeTokenReport/)
  assert.match(tokenFeature, /renderTokenReport/)
  assert.match(tokenFeature, /client\.session\.prompt/)
  assert.match(quotaFeature, /pluginDescriptor\(["']quota["']\)\.slotOrder/)
  assert.doesNotMatch(quotaFeature, /quotaSidebarSlotOrder/)
  assert.doesNotMatch(quotaFeature, /\border:\s*110\b/)
  assert.doesNotMatch(source("tui/quota.tsx"), /from ["']\.\/providers\/opencode-go/)
  assert.doesNotMatch(source("tui/home.tsx"), /opencode-go/)
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

  assert.equal(computeTokenReport.length, 2, "computeTokenReport must accept injected data dependencies")

  const emptyBuckets = { input: 0, output: 0, reasoning: 0, cache_read: 0, cache_write: 0 }
  const aggregateResult = {
    window: { sinceMs: 1_768_348_800_000, untilMs: 1_768_435_200_000 },
    totals: {
      priced: { ...emptyBuckets, input: 120, output: 30 },
      unknown: emptyBuckets,
      unpriced: emptyBuckets,
      costUsd: 0.25,
      messageCount: 2,
      sessionCount: 1,
    },
    bySourceProvider: [],
    bySourceModel: [],
    byModel: [],
    bySession: [],
    unknown: [],
    unpriced: [],
  }
  const aggregateCalls = []
  const successful = await computeTokenReport({
    command: "tokens_daily",
    sessionID: "session-1",
    generatedAtMs: 1_768_435_200_000,
  }, {
    aggregateUsage: async (params) => {
      aggregateCalls.push(params)
      return aggregateResult
    },
    resolveSessionTree: async () => {
      throw new Error("tokens_daily must not resolve a session tree")
    },
  })
  assert.deepEqual(aggregateCalls, [{
    sinceMs: 1_768_348_800_000,
    untilMs: 1_768_435_200_000,
    sessionID: undefined,
    sessionIDs: undefined,
  }])
  assert.deepEqual(successful, {
    kind: "report",
    title: "Tokens used (Last 24 Hours)",
    result: aggregateResult,
    topModels: undefined,
    topSessions: undefined,
    focusSessionID: "session-1",
    sessionOnly: undefined,
    reportKind: undefined,
    sessionTree: undefined,
    generatedAtMs: 1_768_435_200_000,
  })
  assert.equal("markdown" in successful, false)

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
