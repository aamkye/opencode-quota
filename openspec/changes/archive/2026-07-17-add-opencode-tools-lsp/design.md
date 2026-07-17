## Context

The repository now ships quota, home, token-report, and MCP as standalone TUI plugins described by one manifest. MCP established the nearest pattern for a compact status panel: a pure shared model, a thin Solid/OpenTUI adapter, controlled KV-backed collapse state, shared `CompactPanel` primitives, manifest-driven build and deployment, and mounted rendering tests.

OpenCode exposes the current language servers through reactive `api.state.lsp()` entries with `id`, `name`, `root`, and `connected` or `error` status. OpenCode also ships `internal:sidebar-lsp`; the external plugin must coexist unless users explicitly disable the built-in panel. The visible contract is the 37-column LSP layout in `AGENTS.md`.

## Goals / Non-Goals

**Goals:**

- Add LSP as a fifth independently installable plugin without changing existing plugin behavior.
- Keep LSP state interpretation in pure shared logic and host binding in a thin adapter.
- Match the expanded, empty, and collapsed layouts specified in `AGENTS.md`.
- Preserve host order, react to state changes without polling or remounting, and persist collapse preference.
- Extend manifest-driven build, deployment, migration, package exports, tests, and documentation.

**Non-Goals:**

- Display LSP root paths, implementation names, textual statuses, diagnostics, or error details.
- Configure, start, stop, restart, or otherwise control language servers.
- Sort or group entries independently of OpenCode.
- Automatically deactivate `internal:sidebar-lsp`.
- Refactor quota, MCP, or the shared presentation system beyond changes required to reuse it safely.

## Decisions

### Follow the MCP standalone feature boundary

LSP will use a shared pure model plus a thin `tui/lsp.tsx` adapter created through `defineTuiPlugin`. This keeps status mapping and count derivation testable without mounting Solid while limiting the adapter to `api.state.lsp()`, KV state, theme binding, and slot registration.

Alternatives considered were embedding all decisions in the adapter, which would duplicate unmounted and mounted test logic, and routing LSP through the general semantic panel renderer, which would add model complexity without improving this simple list layout. Reusing the MCP boundary is the smallest consistent approach.

### Reuse the compact shell but use an LSP-specific row

The adapter will render through `CompactPanel` for the marker, right-aligned collapsed summary, bounded content, and full-width separators. LSP rows need only a fixed bullet cell and one flexible truncating ID cell, so they will use a minimal LSP-specific row or a narrowly reusable name-row primitive rather than `CompactStatusRow`, whose right-aligned text label is an MCP requirement.

Connected bullets use the success theme role and error bullets use the error role. Names remain plain, no status text is appended, and the source order is preserved.

### Persist explicit collapse state without forcing the empty state

The plugin will read and write a namespaced LSP collapse key. The default is expanded. An empty panel remains interactive and expanded unless the user has explicitly collapsed it; its body contains the muted activation hint. This differs intentionally from MCP's forced-empty collapse because the LSP layout specifies instructional empty content.

Reactive transitions from empty to populated and back retain the same preference and component root. The collapsed summary is the current number of active entries, including `0`.

### Extend the manifest as the single plugin inventory

The manifest will add LSP immediately after MCP with its own normalized ID, source, output artifact, slot order, and no options. Package exports, build outputs, deployment entries, stale-artifact handling, and tests will continue deriving from this manifest rather than adding an LSP-only inventory.

Managed deployment will add the fifth entry idempotently while preserving unrelated entries and quota-only options. Documentation will identify `internal:sidebar-lsp` as the built-in panel users disable to avoid duplicates.

## Risks / Trade-offs

- [The local TUI declaration can drift from OpenCode's LSP API] -> Import the SDK `LspStatus` shape where possible, add a compile fixture, and cover both declared statuses.
- [Long IDs can overflow the sidebar or leave trailing padding] -> Reserve only the bullet width, make the ID region flexible and truncating, and assert 37- and 36-cell mounted layouts.
- [Empty-state transitions can reset user intent] -> Keep collapse in one KV-backed signal independent of the current entry count and test empty-to-populated transitions without remounting.
- [Deployment can duplicate or reorder managed entries] -> Derive expected entries from the manifest and test legacy, current, unrelated, local, global, and repeated deployment cases.
- [The built-in panel can duplicate the external panel] -> Document explicit built-in deactivation and do not claim automatic replacement.

## Migration Plan

1. Add LSP typing, pure model tests, and the model export.
2. Add mounted behavior tests and the standalone adapter after MCP.
3. Extend manifest-derived package, build, and deployment expectations to five artifacts.
4. Update usage and replacement documentation.
5. Verify tests, strict typecheck, and production builds.

Rollback removes the external LSP entry and artifact and re-enables `internal:sidebar-lsp`; existing LSP configuration and server processes are unaffected.

## Open Questions

None. Deep design will validate the exact row primitive and test matrix before implementation planning.
