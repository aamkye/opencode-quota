# Task 11 Validation Report

## Scope

Validated the three-artifact local distribution for
`refactor-opencode-tools-tui` Task 11 against OpenCode 1.17.20. The work changed
only build/runtime compatibility, the local TUI type declaration, dependency
alignment, and focused artifact tests after runtime validation reproduced
defects.

## Reproduced Defects

### Bare Config Activation

OpenCode calls `tui(api, undefined)` for a bare file-plugin entry. The built
quota artifact read `options.otherProviders` and threw before registering its
slots.

- Added an artifact-level activation test that passes `undefined` and requires
  `sidebar_content` followed by `home_bottom` registration.
- Made `TuiPluginOptions` optional in the local declaration.
- Made `pluginOptions` accept an omitted value and retain the existing defaults.

The test failed with `Cannot read properties of undefined (reading
'otherProviders')` before the fix and passed after it.

### JSX Compilation

After activation succeeded, OpenCode invoked `sidebar_content` and the built
artifact threw `ReferenceError: React is not defined`. Esbuild had compiled TSX
through the classic React transform.

- Added an artifact assertion for the OpenTUI JSX runtime and against React
  globals.
- Configured esbuild's automatic JSX transform with `@opentui/solid`.
- Aligned `@opentui/solid` with the existing `@opentui/core` 0.4 dependency.

### Host Runtime Identity

Automatic JSX removed the React failure, but the deployed file plugin then
threw `Error: No renderer found`. Its bare `solid-js` and
`@opentui/solid/jsx-runtime` imports resolved from this project's
`node_modules`, creating a runtime instance separate from OpenCode's renderer.

An isolated OpenCode probe confirmed these host-owned virtual modules:

- `opentui:runtime-module:solid-js`
- `opentui:runtime-module:%40opentui%2Fcore`
- `opentui:runtime-module:%40opentui%2Fsolid%2Fjsx-runtime`

The artifact test first failed because the generated file still contained bare
runtime imports. The build now rewrites the two emitted Solid imports to the
OpenCode virtual module IDs. The test passes, and the deployed slot callback
returns an OpenTUI object without `React is not defined` or `No renderer found`.

## Automated Validation

| Command | Result |
| --- | --- |
| `npm run typecheck && npm test && npm run build:plugins` | Exit 0. TypeScript passed; 106 tests passed, 0 failed; all three minified ESM artifacts built. |
| `node --test tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs` | Exit 0. 14 tests passed, 0 failed. |
| `npm run deploy:local` | Exit 0. Deployed the shared, quota, and token artifacts under `.opencode` using local file entries. |
| `git diff --check` | Exit 0 with no output. |

The artifact gate confirms that the quota and token entries import only the
relative shared artifact for project computation. It also confirms that the
shared artifact has no plugin default export or JSX and that no generated entry
contains an npm package spec for opencode-tools.

## OpenCode Validation

The final 140-column session capture loaded
`.opencode/opencode-tools-quota.js` through `.opencode/tui.json` and rendered one
ordered `Quota` sidebar panel. The panel showed the Z.AI loading state and a
parent-width divider. The slot wrapper recorded
`sidebar_content` returning an object.

Earlier plugin-state evidence recorded `aamkye/opencode-tools` as enabled and
active after the omitted-options fix. Token-command evidence rendered the
deployed `/tokens_today` report from the shared computation artifact. OpenCode
did not emit `Failed to update plugin aamkye/opencode-tools`, and the shared
artifact did not appear as a plugin.

The terminal runner cannot send reliable mouse events or select providers. At
130 and 140 columns OpenCode uses a fixed 40-column sidebar; at 120 columns it
hides the sidebar. This prevented direct interaction checks for collapse state,
provider switching, and a narrower visible sidebar. The 106-test gate covers
selected/secondary ordering, independent collapse state, parent-width layout,
ellipsis trimming, compact-table contraction, right alignment, reset states,
themed statuses, and multi-window provider models.

## Environmental Noise

The global `opencode-tui-utils` package still reports `Plugin opencode-tui-utils
must default export an object with server()`. LM Studio also reports that its
local server is offline. Neither message originates from the deployed
opencode-tools artifacts.

## Evidence

- `.superpowers/sdd/task-11-final-gate.log`
- `.superpowers/sdd/task-11-final-focused-gate.log`
- `.superpowers/sdd/task-11-final-deploy.log`
- `.superpowers/sdd/task-11-final-sidebar.log`
- `.superpowers/sdd/task-11-final-slot-wrapper.log`
- `.superpowers/sdd/task-11-constrained.log`
- `.superpowers/sdd/task-11-tokens-executed.log`
- `.superpowers/sdd/task-11-postfix-plugin-state-3.log`

## Important Finding 1 Follow-up

The shared artifact owns `createOpenAiProvider` and `createZaiProvider`, so it
also owns the Solid signals and effects behind provider polling. The previous
build rewrote Solid imports only for the quota artifact: shared imported bare
`solid-js`, while the quota renderer imported
`opentui:runtime-module:solid-js`. That split Solid's runtime-local dependency
tracking across two module instances and could leave host renderer effects
unsubscribed from shared provider updates.

- RED: `node --test tests/plugin-build.test.mjs` passed 6 tests and failed the
  new shared/quota runtime-identity test because
  `dist/opencode-tools-shared.js` imported `solid-js` instead of the OpenCode
  host module.
- GREEN: after applying the existing host-runtime import resolver to the shared
  build, the same command passed 7/7. The test now inspects both shared and quota,
  rejects bare Solid imports in either artifact, retains the quota JSX-runtime
  assertion, and verifies virtual host imports remain external.
- Runtime: a Node browser-condition probe loaded the built shared artifact
  through the same virtual-module resolver used by the artifact harness. A host
  `createEffect` observed the shared OpenAI provider freshness transition
  `loading -> ready`, demonstrating reactive notification across the explicit
  shared ESM boundary.

The quota and token entries still import the explicit relative shared artifact,
and Solid, OpenTUI, OpenCode SDK/plugin modules, Bun modules, database bindings,
and built-ins remain external rather than bundled.

## Final Code-Fix Round: Hermetic Artifact Activation

The artifact activation test previously restored `globalThis.fetch` as soon as
slot registration completed, while provider effects and their unowned Solid
roots could continue running. It also loaded provider credential paths from the
developer environment, and the shared `loading -> ready` runtime probe existed
only as narrative evidence.

- RED: `npm run build:plugins && node --test tests/plugin-build.test.mjs` passed
  6 tests and failed the activation test because neither a provider adapter nor
  the combined TUI activation exposed a root disposer.
- GREEN: provider adapters now retain their `createRoot` disposer; quota and
  home activations aggregate provider cleanup; and the built combined entry
  returns one cleanup function. The focused artifact suite passes 7/7.
- Hermetic setup: the test copies the built shared/quota pair to a temporary
  root, points `HOME`, `XDG_CONFIG_HOME`, and `XDG_DATA_HOME` there before module
  evaluation, and supplies only a synthetic OpenAI provider token and complete
  local response. It asserts every intercepted request targets the OpenAI usage
  endpoint with that synthetic token.
- Reactive evidence: a host-runtime `createEffect` now observes the built shared
  provider transition exactly `loading -> ready` in the automated artifact
  test. The test waits for that transition, disposes the probe, provider, and
  combined activation roots, lets cleanup settle, and only then restores fetch,
  environment variables, and temporary files.

Final evidence:

- `npm run typecheck && npm test && npm run build:plugins`: exit 0; 106 tests
  passed and all three artifacts built.
- `node --test tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs`:
  exit 0; 14 tests passed.
- Three consecutive `node --test tests/plugin-build.test.mjs` runs: each passed
  7/7.
- `git diff --check`: exit 0.

## Exceptional Final Fix Round: OpenCode Lifecycle Ownership

OpenCode 1.17.20 awaits `plugin.tui(...)` without retaining its return value.
The host owns plugin cleanup through `api.lifecycle.onDispose`, aborts the
lifecycle signal before cleanup, and runs registered handlers in reverse order
both on deactivation and after partial activation failure. The prior combined
artifact therefore returned a disposer the host ignored, and a failure while
activating the home sub-plugin could orphan the quota sub-plugin's provider
roots.

- RED: `node --test tests/plugin-build.test.mjs` passed 6 tests and failed the
  lifecycle regression because built activation returned a function instead of
  `undefined`; no host lifecycle cleanup was registered. A focused
  partial-construction probe then left two provider intervals active when the
  second provider factory failed.
- GREEN: quota and home now register provider cleanup through
  `api.lifecycle.onDispose` before constructing providers. The combined entry
  awaits both activations and returns nothing. A host-shaped regression verifies
  two lifecycle handlers on successful activation, ignored-return semantics,
  signal abortion, cleanup availability when the second slot registration
  throws, and disposal of the first provider when the second provider factory
  fails. Providers are added to the cleanup collection sequentially so the first
  adapter is owned before the second is constructed.
- Type contract: the local TUI declaration now includes lifecycle `signal` and
  `onDispose`, defines asynchronous `TuiDispose`, and matches the host's
  `Promise<void>` plugin activation contract.
- Provider isolation: OpenAI and Z.AI tests set isolated `HOME`,
  `XDG_CONFIG_HOME`, and `XDG_DATA_HOME` values before provider module
  evaluation. Every provider adapter constructed by those tests is disposed
  through test cleanup.

Final evidence for this round:

- `node tests/compile-presentation.mjs && node --test tests/provider-openai.test.mjs tests/provider-zai.test.mjs tests/quota-composition.test.mjs`:
  exit 0; 32 tests passed.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0; 106 tests passed.
- `npm run build:plugins`: exit 0; all three minified ESM artifacts built.
- `node --test tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs`:
  exit 0; 14 tests passed.
- `git diff --check`: exit 0 with no output.
