## Context

The repository ships quota, home, and token-report through one generated artifact even though their source modules expose different activation shapes. Build and deployment scripts repeat artifact metadata, quota and home create duplicate provider adapters, and TUI modules mix feature decisions with host binding. OpenCode 1.18.1 also exposes MCP state through `api.state.mcp()`.

The change must add MCP and leave a foundation for the planned plugin rewrites. The user chose one broadened change, standalone artifacts only, normalized IDs, and automatic migration from the composed installation.

## Goals / Non-Goals

**Goals:**

- Give every current and future TUI feature one standalone registration and lifecycle contract.
- Make one declarative manifest authoritative for runtime, build, and deployment metadata.
- Keep feature decisions and shared services outside thin host and rendering adapters.
- Deduplicate quota and home provider polling through ref-counted shared services.
- Preserve quota output while moving quota and MCP onto shared compact-sidebar primitives.
- Deliver the specified MCP health panel and replacement documentation.

**Non-Goals:**

- Create a declarative UI language for slots, commands, routes, or dialogs.
- Compose multiple features into one runtime plugin artifact.
- Change quota calculations, home content, token-report commands, or MCP server lifecycle.
- Add MCP operations, runtime error details, or automatic built-in plugin deactivation.
- Support OpenCode versions older than 1.18.1.

## Decisions

### Use a layered standalone framework and manifest

A data-only manifest records each feature key, normalized runtime ID, source entry, output artifact, optional slot order, and option ownership. A shared `defineTuiPlugin` contract creates the OpenCode module shape and manages activation cleanup. Build and deployment iterate the same manifest.

Each feature ships as one artifact: quota, home, token-report, and MCP. TUI modules bind OpenCode APIs and render Solid/OpenTUI components. Shared modules own option normalization, models, services, command definitions, status semantics, and lifecycle helpers.

### Share services by API-scoped leases

The shared runtime stores services by TUI API and service key. Quota and home acquire one provider hub. The first lease creates adapters; later leases reuse them. Cleanup releases each lease once and disposes the hub after the final release. Activation rollback and already-aborted lifecycle paths release acquired services.

This keeps every artifact independently installable while removing duplicate OpenAI and Z.AI polling when quota and home run together.

### Share compact-sidebar primitives without forcing one feature model

Quota retains its semantic panel model and item renderer. A shared controlled shell provides the header, marker, collapsed summary segments, full-width separators, bounded content region, and collapse callback. MCP uses the shell plus a reusable status row. Quota keeps ephemeral collapse state. MCP supplies a KV-backed controller and an empty-state override.

Home and token-report retain their distinct surfaces. They adopt the registration contract, shared models, and service runtime without pretending to be sidebar panels.

### Model MCP status in shared pure logic

The MCP model preserves host order and maps each server to a stable label and semantic color role. Only `connected` contributes to the numerator. A non-empty fully connected aggregate is green. Any non-connected entry makes the denominator red while the numerator stays green and the slash stays muted. Empty `0/0` is muted.

Known row roles match OpenCode: connected is success, failed and client-registration errors are error, needs-auth is warning, and disabled is muted. Unknown future statuses count as non-connected and render muted `Unknown`.

### Migrate managed installations in one release

Deployment removes the old composed entry and stale managed artifacts, then writes four standalone entries in manifest order. It transfers existing options only to quota, preserves unrelated entries, and remains idempotent. Runtime IDs use the normalized `aamkye/opencode-tools-<feature>` form, including the intentional quota ID change.

The package engine requires OpenCode 1.18.1 or newer. Documentation explains how to disable `internal:sidebar-mcp` and how to roll back to the built-in panel.

## Risks / Trade-offs

- [Standalone migration can lose options or duplicate entries] -> Test local and global legacy configurations, unrelated entries, repeat deployment, and quota option transfer.
- [Ref-counted services can leak or dispose early] -> Make leases idempotent and test success, partial failure, aborted activation, multiple consumers, and final release.
- [Shared shell changes can regress quota output] -> Run existing quota tests and add mounted parity cases before MCP implementation.
- [Normalized quota ID can reset host-managed plugin state] -> Document the intentional breaking ID change and keep feature KV keys explicit.
- [Manifest metadata can drift from source exports] -> Derive build and deployment expectations from the manifest and validate every source and emitted artifact.
- [Long MCP names can crowd status labels] -> Reserve status width and truncate the flexible name region within 37 cells.

## Migration Plan

1. Introduce the manifest, runtime contract, and service lease tests without changing emitted artifacts.
2. Move current feature logic behind shared boundaries and prove quota, home, and token-report parity.
3. Split current features into standalone artifacts and update deployment migration.
4. Add MCP through the established runtime and compact-sidebar primitives.
5. Raise the engine floor and update installation and replacement documentation.
6. Roll back by restoring the previous artifact set and config entry; users can remove MCP and re-enable `internal:sidebar-mcp` independently.

## Open Questions

None. The confirmed Superpowers Design Doc contains the detailed contracts and test matrix.
