import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const legacyIdentifier = ["opencode", "quota"].join("-")

test("publishes and typechecks the standalone plugins", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"))
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"))
  const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8"))

  assert.deepEqual(pkg.exports, {
    "./quota": "./tui/quota.tsx",
    "./home": "./tui/home.tsx",
    "./token-report": "./tui/token-report.tsx",
    "./mcp": "./tui/mcp.tsx",
    "./context": "./tui/context.tsx",
    "./lsp": "./tui/lsp.tsx",
    "./todo": "./tui/todo.tsx",
  })
  assert.deepEqual(pkg.files, ["dist", "plugin-manifest.json", "tui", "shared", "README.md"])
  assert.deepEqual(tsconfig.include, [
    "opencode-plugin-tui.d.ts",
    "lib/session-title.ts",
    "session-title.ts",
    "tui/**/*.ts",
    "tui/**/*.tsx",
    "shared/**/*.ts",
    "tests/*-state-types.fixture.ts",
  ])
  assert.equal(pkg.engines.opencode, ">=1.18.1")
  assert.equal(lock.packages[""].engines.opencode, ">=1.18.1")
})

test("source modules own the TUI slots without root-config activation", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"))
  const tui = JSON.parse(readFileSync("tui.json", "utf8"))
  const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8"))

  assert.equal(pkg.name, "@aamkye/opencode-tools")
  assert.equal(pkg.files.includes("tui"), true)
  assert.equal(tui.$schema, "https://opencode.ai/tui.json")
  assert.equal(tui.plugin, undefined)
  assert.equal(readFileSync("tui/quota.tsx", "utf8").includes("sidebar_content"), true)
  assert.equal(readFileSync("tui/quota.tsx", "utf8").includes("home_bottom"), false)
  assert.equal(readFileSync("tui/home.tsx", "utf8").includes("home_bottom"), true)
  assert.equal(readFileSync("tui/home.tsx", "utf8").includes("sidebar_content"), false)
  assert.equal(tsconfig.include.some((entry) => entry.includes(legacyIdentifier)), false)
  assert.equal(existsSync(`${legacyIdentifier}-home.tsx`), false)
})

test("tracked project files contain no active legacy identifier", () => {
  const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
    .filter((file) => !file.startsWith("openspec/") && !file.startsWith("docs/superpowers/"))
    .filter((file) => existsSync(file))
    .filter((file) => /(?:^|\/)(?:README\.md|package(?:-lock)?\.json|tsconfig\.json|tui\.json|[^/]+\.(?:[cm]?[jt]sx?|json|md))$/.test(file))

  for (const file of trackedFiles) {
    const content = readFileSync(file, "utf8")
      .replaceAll(`https://github.com/slkiser/${legacyIdentifier}`, "")
    assert.equal(content.includes(legacyIdentifier), false, `${file} retains a legacy project identifier`)
  }
})

test("documents standalone installation, migration, MCP, Context, LSP, and TODO layouts, and rollback", () => {
  const readme = readFileSync("README.md", "utf8")
  const prose = readme.replace(/\s+/gu, " ")
  const introduction = readme.match(/^# opencode-tools\n\n([\s\S]*?)(?=\n## Features)/u)?.[1]
  const contextFeatures = readme.match(/### Context\n\n([\s\S]*?)(?=\n### LSP)/u)?.[1]
  const configurationSection = readme.match(/### Configuration\n\n([\s\S]*?)(?=\n### MCP sidebar layouts)/u)?.[1]
  const configurationText = readme.match(/### Configuration\n\n[\s\S]*?```json\n([\s\S]*?)\n```/u)?.[1]
  assert.ok(introduction, "missing README introduction")
  assert.ok(contextFeatures, "missing Context feature section")
  assert.ok(configurationSection, "missing Configuration section")
  assert.ok(configurationText, "missing documented tui.json configuration")
  assert.match(introduction.replace(/\s+/gu, " "), /MCP server health, active-session context and spend, LSP status/u)

  const configuration = JSON.parse(configurationText)
  assert.equal(Array.isArray(configuration.plugin), true, "documented tui.json must contain a plugin array")
  assert.deepEqual(configuration.plugin.map((entry) => Array.isArray(entry) ? entry[0] : entry), [
    "./opencode-tools-quota.js",
    "./opencode-tools-home.js",
    "./opencode-tools-token-report.js",
    "./opencode-tools-mcp.js",
    "./opencode-tools-context.js",
    "./opencode-tools-lsp.js",
    "./opencode-tools-todo.js",
  ])
  assert.equal(configuration.plugin.includes("./opencode-tools-context.js"), true)
  assert.deepEqual(Object.keys(configuration.plugin[0][1]), ["quota"])
  assert.equal(configuration.plugin.slice(1).every((entry) => typeof entry === "string"), true)
  assert.deepEqual(configuration.plugin_enabled, {
    "internal:sidebar-mcp": false,
    "internal:sidebar-lsp": false,
    "internal:sidebar-todo": false,
  })

  for (const text of [
    "updates context and spend values from synchronized session and message state without polling",
    "sums finite detailed `input`, `output`, `reasoning`, `cache.read`, and `cache.write` buckets and uses the newest assistant message whose sum is positive",
    "sums finite assistant-message costs for the active session and ignores missing or non-finite costs",
    "shows `Tokens -`, `Used -`, and `Spent $0.00` when the host has not supplied usable context data",
    "remembers the user's header-click preference",
  ]) assert.equal(contextFeatures.replace(/\s+/gu, " ").includes(text), true, `missing Context feature text: ${text}`)

  assert.match(
    configurationSection.replace(/\s+/gu, " "),
    /Context ships as a separate opt-in artifact\. Enable it by adding `\.\/opencode-tools-context\.js` to the `plugin` array\./u,
  )
  assert.match(configurationSection, /Context, LSP, and TODO accept no options\./u)
  assert.match(configurationSection, /Context has no built-in panel override\s+to disable\./u)

  for (const id of [
    "aamkye/opencode-tools-quota",
    "aamkye/opencode-tools-home",
    "aamkye/opencode-tools-token-report",
    "aamkye/opencode-tools-mcp",
    "aamkye/opencode-tools-context",
    "aamkye/opencode-tools-lsp",
    "aamkye/opencode-tools-todo",
  ]) assert.equal(readme.includes(`\`${id}\``), true, `missing runtime ID: ${id}`)

  for (const text of [
    "OpenCode 1.18.1 or newer",
    "automatically migrates managed configuration entries",
    "preserves unrelated plugin entries",
    "preserves existing quota options",
    "quota options remain attached only to the quota entry",
    "normalized quota runtime ID",
    "host-managed plugin state may reset",
    "Users must disable `internal:sidebar-mcp`, `internal:sidebar-lsp`, and `internal:sidebar-todo` themselves",
    "Deployment does not edit `plugin_enabled` or disable the built-in MCP, LSP, or TODO panel",
    "Set the overrides in the configuration example yourself when replacing any built-in panel",
    "Rollback",
    "remove `./opencode-tools-mcp.js`",
    "re-enable `internal:sidebar-mcp`",
    "remove `./opencode-tools-context.js`",
    "remove `./opencode-tools-lsp.js`",
    "re-enable `internal:sidebar-lsp`",
    "remove `./opencode-tools-todo.js`",
    "re-enable `internal:sidebar-todo`",
    "restart OpenCode",
  ]) assert.equal(prose.includes(text), true, `missing README text: ${text}`)
  assert.doesNotMatch(prose, /automatically disables? `?internal:sidebar-mcp`?/iu)
  assert.doesNotMatch(prose, /automatically disables? `?internal:sidebar-lsp`?/iu)
  assert.doesNotMatch(prose, /automatically disables? `?internal:sidebar-todo`?/iu)

  const expectedLayouts = new Map([
    ["Expanded", [
      "▼ MCP",
      "-".repeat(37),
      `${"• codegraph-global".padEnd(28)}Connected`,
      `${"• context7-global".padEnd(28)}Connected`,
      `${"• postgres-test-vendsystem".padEnd(29)}Disabled`,
      `${"• postgres-test-vendsystem…".padEnd(29)}Disabled`,
      "-".repeat(37),
    ]],
    ["Collapsed, all connected", [
      `${"▶ MCP".padEnd(34)}2/2`,
      "-".repeat(37),
    ]],
    ["Collapsed, attention needed", [
      `${"▶ MCP".padEnd(34)}2/3`,
      "-".repeat(37),
    ]],
    ["Collapsed, empty", [
      `${"▶ MCP".padEnd(34)}0/0`,
      "-".repeat(37),
    ]],
  ])

  for (const [heading, expected] of expectedLayouts) {
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
    const layout = readme.match(new RegExp(`#### ${escapedHeading}\\n\\n\`\`\`text\\n([\\s\\S]*?)\\n\`\`\``, "u"))?.[1]
    assert.ok(layout, `missing ${heading} MCP layout`)
    const lines = layout.split("\n")
    assert.deepEqual(lines, expected, `${heading} MCP layout changed`)
    for (const line of lines) {
      assert.ok([...line].length <= 37, `${heading} layout exceeds 37 cells: ${line}`)
      assert.equal(line.trimEnd(), line, `${heading} layout has trailing whitespace`)
    }
  }

  assert.match(prose, /For the healthy `2\/2` summary, both numbers use the success color and the slash is muted\./u)
  assert.match(prose, /For the unhealthy `2\/3` summary, `2` uses the success color, `3` uses the error color, and the slash is muted\./u)
  assert.match(prose, /For the empty `0\/0` summary, both numbers and the slash are muted\./u)

  const mcpLayoutsIndex = readme.indexOf("\n### MCP sidebar layouts")
  const contextLayoutsIndex = readme.indexOf("\n### Context sidebar layouts")
  const lspLayoutsIndex = readme.indexOf("\n### LSP sidebar layouts")
  assert.ok(
    mcpLayoutsIndex >= 0 && mcpLayoutsIndex < contextLayoutsIndex && contextLayoutsIndex < lspLayoutsIndex,
    "README sidebar layout sections must be ordered MCP -> Context -> LSP",
  )
  const contextLayouts = readme.match(/### Context sidebar layouts\n\n([\s\S]*?)(?=\n### LSP sidebar layouts)/u)?.[1]
  assert.ok(contextLayouts, "missing Context sidebar layouts between MCP and LSP")
  assert.match(
    contextLayouts.replace(/\s+/gu, " "),
    /The expanded panel uses `Limit -`, `Tokens -`, `Used -`, and `Spent \$0\.00` when context values are unavailable; the collapsed summary uses `-`\./u,
  )
  const expectedContextLayouts = new Map([
    ["Expanded", [
      "▼ Context",
      "-".repeat(37),
      "Limit                            500K",
      "Tokens                        322.12K",
      "Used                              64%",
      "Spent                           $0.00",
      "-".repeat(37),
    ]],
    ["Collapsed", [
      "▶ Context                         64%",
      "-".repeat(37),
    ]],
  ])

  for (const [heading, expected] of expectedContextLayouts) {
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
    const layout = contextLayouts.match(new RegExp(`#### ${escapedHeading}\\n\\n\`\`\`text\\n([\\s\\S]*?)\\n\`\`\``, "u"))?.[1]
    assert.ok(layout, `missing ${heading} Context layout`)
    const lines = layout.split("\n")
    assert.deepEqual(lines, expected, `${heading} Context layout changed`)
    for (const line of lines) {
      assert.ok([...line].length <= 37, `${heading} Context layout exceeds 37 cells: ${line}`)
      assert.equal(line.trimEnd(), line, `${heading} Context layout has trailing whitespace`)
    }
  }

  const lspLayouts = readme.match(/### LSP sidebar layouts\n\n([\s\S]*?)(?=\n### TODO sidebar layouts)/u)?.[1]
  assert.ok(lspLayouts, "missing LSP sidebar layouts")
  const expectedLspLayouts = new Map([
    ["Expanded", [
      "▼ LSP",
      "-".repeat(37),
      "• typescript",
      "• yaml-ls",
      "-".repeat(37),
    ]],
    ["Expanded, empty", [
      "▼ LSP",
      "-".repeat(37),
      "LSPs will activate as files are read",
      "-".repeat(37),
    ]],
    ["Collapsed", [
      `${"▶ LSP".padEnd(36)}2`,
      "-".repeat(37),
    ]],
  ])

  for (const [heading, expected] of expectedLspLayouts) {
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
    const layout = lspLayouts.match(new RegExp(`#### ${escapedHeading}\\n\\n\`\`\`text\\n([\\s\\S]*?)\\n\`\`\``, "u"))?.[1]
    assert.ok(layout, `missing ${heading} LSP layout`)
    const lines = layout.split("\n")
    assert.deepEqual(lines, expected, `${heading} LSP layout changed`)
    for (const line of lines) {
      assert.ok([...line].length <= 37, `${heading} LSP layout exceeds 37 cells: ${line}`)
      assert.equal(line.trimEnd(), line, `${heading} LSP layout has trailing whitespace`)
    }
  }

  const todoLayouts = readme.match(/### TODO sidebar layouts\n\n([\s\S]*?)(?=\n### Build and deploy)/u)?.[1]
  assert.ok(todoLayouts, "missing TODO sidebar layouts")
  const expectedTodoLayouts = new Map([
    ["Expanded", [
      "▼ TODO",
      "-".repeat(37),
      "[✓] Explore existing panel patterns",
      "[•] Implement synchronized TODO",
      "    state and wrapped rows",
      "[ ] Verify build and deployment",
      "[-] Superseded task",
      "-".repeat(37),
    ]],
    ["Expanded, empty", [
      "▼ TODO",
      "-".repeat(37),
      "No TODOs for this session",
      "-".repeat(37),
    ]],
    ["Collapsed", [
      `${"▶ TODO".padEnd(34)}2/5`,
      "-".repeat(37),
    ]],
  ])

  for (const [heading, expected] of expectedTodoLayouts) {
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
    const layout = todoLayouts.match(new RegExp(`#### ${escapedHeading}\\n\\n\`\`\`text\\n([\\s\\S]*?)\\n\`\`\``, "u"))?.[1]
    assert.ok(layout, `missing ${heading} TODO layout`)
    const lines = layout.split("\n")
    assert.deepEqual(lines, expected, `${heading} TODO layout changed`)
    for (const line of lines) {
      assert.ok([...line].length <= 37, `${heading} TODO layout exceeds 37 cells: ${line}`)
      assert.equal(line.trimEnd(), line, `${heading} TODO layout has trailing whitespace`)
    }
  }

  const buildAndDeploy = readme.match(/### Build and deploy\n\n([\s\S]*?)(?=\n#### Rollback)/u)?.[1]
  const rollback = readme.match(/#### Rollback\n\n([\s\S]*?)(?=\n### Artifact layout)/u)?.[1]
  const artifactLayout = readme.match(/### Artifact layout\n\n([\s\S]*?)(?=\n### Session title plugin)/u)?.[1]
  const sourceFiles = readme.match(/### Source files\n\n([\s\S]*?)(?=\n### Edit workflow)/u)?.[1]
  const editWorkflow = readme.match(/### Edit workflow\n\n([\s\S]*?)(?=\n## Breaking migration)/u)?.[1]
  assert.ok(buildAndDeploy, "missing Build and deploy section")
  assert.ok(rollback, "missing Rollback section")
  assert.ok(artifactLayout, "missing Artifact layout section")
  assert.ok(sourceFiles, "missing Source files section")
  assert.ok(editWorkflow, "missing Edit workflow section")
  assert.match(buildAndDeploy, /Build the seven standalone minified ESM plugins/u)
  assert.match(buildAndDeploy, /configuration entries to the seven standalone entries in manifest order/u)
  assert.match(
    rollback.replace(/\s+/gu, " "),
    /To remove the Context panel, remove `\.\/opencode-tools-context\.js` from the `plugin` array and restart OpenCode\./u,
  )
  const contextRollback = rollback.match(/To remove the Context panel,[\s\S]*?restart OpenCode\./u)?.[0] ?? ""
  assert.equal(
    contextRollback.replace(/\s+/gu, " "),
    "To remove the Context panel, remove `./opencode-tools-context.js` from the `plugin` array and restart OpenCode.",
  )
  assert.doesNotMatch(contextRollback, /plugin_enabled/u)
  assert.match(artifactLayout, /^├── opencode-tools-context\.js$/mu)
  assert.match(
    artifactLayout,
    /^\| `opencode-tools-context\.js` \| `aamkye\/opencode-tools-context` \| Reactive active-session context and spend panel between MCP and LSP\. \|$/mu,
  )
  assert.match(
    sourceFiles,
    /^\| `tui\/context\.tsx`\s+\| Standalone reactive active-session context and spend sidebar adapter\s+\|$/mu,
  )
  assert.match(sourceFiles, /Builds the shared artifact and seven standalone local ESM plugins/u)
  assert.match(sourceFiles, /Idempotently migrates seven local\/global plugins and `tui\.json` entries/u)
  assert.match(editWorkflow, /npm run build:plugins # rebuild all seven standalone plugins plus shared code/u)

  assert.match(prose, /Long IDs truncate with an ellipsis so expanded lines fit within 37 cells and collapsed lines fit within 36 cells\./u)
  assert.match(prose, /TODO continuation lines align under the content column, and only completed records contribute to the collapsed numerator\./u)
})

test("documents secret-safe OpenCode Go configuration", () => {
  const readme = readFileSync("README.md", "utf8")
  for (const text of [
    "quota.opencodego.workspaceId",
    "quota.opencodego.workspaceToken",
    "workspaceToken is the plaintext auth cookie value",
    "rolling 5H",
    "weekly 7D",
    "subscription month 1M",
    "must not be committed",
    "rotate",
  ]) assert.equal(readme.includes(text), true, `missing README text: ${text}`)

  assert.doesNotMatch(readme, /private (?:JSON|query) endpoint/iu)
  assert.doesNotMatch(readme, /[".]openCodeGo[".]/u)
  assert.doesNotMatch(readme, /(?:copy|save|export).{0,40}(?:full HTML|response body|HAR)/iu)
  const tokenValues = [...readme.matchAll(/"workspaceToken"\s*:\s*"([^"]+)"/gu)].map((match) => match[1])
  assert.deepEqual(tokenValues, ["TOKEN_TEST_ONLY_DO_NOT_USE"])
})

test("documents OpenCode Go provider semantics without exhausted backoff", () => {
  const readme = readFileSync("README.md", "utf8")
  const configuration = readme.match(/`quota\.opencodego\.workspaceId` identifies[\s\S]*?(?=\nPolling defaults to)/u)?.[0]
  const openCodeGoFeatures = readme.match(/### OpenCode Go\n\n([\s\S]*?)(?=\n### Shared)/u)?.[1]
  const sharedFeatures = readme.match(/### Shared\n\n([\s\S]*?)(?=\n## Local-only usage)/u)?.[1]

  assert.ok(configuration, "missing OpenCode Go configuration guidance")
  assert.ok(openCodeGoFeatures, "missing OpenCode Go feature guidance")
  assert.ok(sharedFeatures, "missing shared feature guidance")
  assert.match(
    configuration,
    /The provider sends these workspace credentials only to the fixed\s+`https:\/\/opencode\.ai` origin; they do not replace the OpenCode-managed\s+inference API key\./u,
  )
  assert.match(
    configuration,
    /OpenCode Go reads the\s+undocumented Solid hydration contract from the\s+authenticated page and fails\s+closed if that contract changes\./u,
  )
  assert.match(
    configuration,
    /OpenCode Go uses the shared default\/custom polling interval, one-second\s+countdowns, reset-boundary refresh, and a ten-minute stale horizon without\s+exhausted backoff\./u,
  )
  assert.match(
    openCodeGoFeatures,
    /\*\*Shared refresh behavior\*\*[^.]*ten-minute stale horizon\s+without exhausted backoff\./u,
  )
  assert.match(sharedFeatures, /\*\*Smart polling \(Z\.AI and OpenAI\)\*\*[^.]*backing off to 5min[^.]*exhausted\./u)
  assert.doesNotMatch(readme, /OpenCode Go[^.]{0,200}(?:backs? off|backing off)[^.]{0,100}exhaust/iu)
})
