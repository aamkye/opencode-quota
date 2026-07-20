---
description: 'Top-level OKF summary: 1479 concepts across 11 domains and 126 modules'
git_branch: feature/20260720/polish-tui-session-rename
git_repo: opencode-quota
okf_version: '0.2'
timestamp: '2026-07-20T12:27:09Z'
title: okf_bundle — Knowledge Summary
type: Index
---

# okf_bundle — Knowledge Summary

> OKF v0.2 bundle | 1,479 concepts | 11 domains | 126 modules

## Stats

| Type | Count |
|------|-------|
| Function | 1,027 |
| Type | 275 |
| Module | 137 |
| Interface | 31 |
| Dependency | 8 |
| Class | 1 |

| Language | Concepts |
|----------|----------|
| typescript | 1,112 |
| javascript | 359 |
| manifest | 8 |

## Domain Map

Use these links to navigate the bundle or prime an AI agent with focused context.

### [build-plugins.mjs](build-plugins.mjs/index.md) — 7 concepts

- [build-plugins](build-plugins/index.md) (7 concepts)

### [build-session-rename.mjs](build-session-rename.mjs/index.md) — 1 concepts

- [build-session-rename](build-session-rename/index.md) (1 concepts)

### [deploy-plugins.mjs](deploy-plugins.mjs/index.md) — 14 concepts

- [deploy-plugins](deploy-plugins/index.md) (14 concepts)

### [deploy-session-rename.mjs](deploy-session-rename.mjs/index.md) — 1 concepts

- [deploy-session-rename](deploy-session-rename/index.md) (1 concepts)

### [lib](lib/index.md) — 278 concepts

- [lib/tokens/modelsdev-pricing](lib/tokens/modelsdev-pricing/index.md) (50 concepts)
- [lib/tokens/quota-stats](lib/tokens/quota-stats/index.md) (34 concepts)
- [lib/tokens/opencode-storage](lib/tokens/opencode-storage/index.md) (29 concepts)
- [lib/tokens/quota-stats-format](lib/tokens/quota-stats-format/index.md) (20 concepts) — Use markdown-conceal for proper TUI alignment (strips markdown syntax for width 
- [lib/tokens/format-utils](lib/tokens/format-utils/index.md) (18 concepts)
- [lib/tokens/opencode-sqlite](lib/tokens/opencode-sqlite/index.md) (17 concepts)
- [lib/session-rename](lib/session-rename/index.md) (14 concepts)
- [lib/tokens/report-document](lib/tokens/report-document/index.md) (13 concepts)
- *…and 16 more modules*

### [opencode-plugin-tui.d.ts](opencode-plugin-tui.d.ts/index.md) — 19 concepts

- [opencode-plugin-tui](opencode-plugin-tui/index.md) (19 concepts)

### [plugin-manifest.mjs](plugin-manifest.mjs/index.md) — 2 concepts

- [plugin-manifest](plugin-manifest/index.md) (2 concepts)

### [session-rename.ts](session-rename.ts/index.md) — 2 concepts

- [session-rename](session-rename/index.md) (2 concepts)

### [shared](shared/index.md) — 2 concepts

- [shared/opencode-tools-shared](shared/opencode-tools-shared/index.md) (2 concepts)

### [tests](tests/index.md) — 622 concepts

- [tests/subagent-mounted](tests/subagent-mounted/index.md) (61 concepts)
- [tests/plugin-adapters](tests/plugin-adapters/index.md) (41 concepts)
- [tests/ses-tokens-mounted](tests/ses-tokens-mounted/index.md) (37 concepts)
- [tests/compact-panel-mounted](tests/compact-panel-mounted/index.md) (32 concepts)
- [tests/plugin-build](tests/plugin-build/index.md) (28 concepts)
- [tests/context-mounted](tests/context-mounted/index.md) (26 concepts)
- [tests/subagent-source](tests/subagent-source/index.md) (26 concepts)
- [tests/todo-mounted](tests/todo-mounted/index.md) (24 concepts)
- *…and 52 more modules*

### [tui](tui/index.md) — 523 concepts

- [tui/providers/opencode-go](tui/providers/opencode-go/index.md) (44 concepts)
- [tui/providers/zai](tui/providers/zai/index.md) (43 concepts)
- [tui/providers/openai](tui/providers/openai/index.md) (36 concepts)
- [tui/features/quota](tui/features/quota/index.md) (35 concepts)
- [tui/presentation/renderer](tui/presentation/renderer/index.md) (33 concepts)
- [tui/services/subagent-source](tui/services/subagent-source/index.md) (31 concepts)
- [tui/services/quota-provider-hub](tui/services/quota-provider-hub/index.md) (25 concepts)
- [tui/services/session-tree-snapshot](tui/services/session-tree-snapshot/index.md) (23 concepts)
- *…and 26 more modules*

## Dependencies

> Full list at [`_dependencies/index.md`](/_dependencies/index.md) or `okf lookup --type Dependency`

| Ecosystem | Packages |
|----------|----------|
| npm | 8 |

## Key Concepts

Highest-value concepts across all domains (Classes and Functions with rich descriptions).

| Concept | Type | Module | Description |
|---------|------|--------|-------------|
| [measureWidth](/lib/tokens/markdown-table/measureWidth.md) | Function | `lib/tokens/markdown-table.ts` | Measure width using grapheme clusters (preferred) or code po… |
| [truncateTitle](/lib/tokens/quota-stats-format/truncateTitle.md) | Function | `lib/tokens/quota-stats-format.ts` | Truncate a title to first 10 + last 10 chars with ellipsis i… |
| [toVisualTextForWidth](/lib/tokens/markdown-table/toVisualTextForWidth.md) | Function | `lib/tokens/markdown-table.ts` | Convert markdown text to visual representation for width cal… |
| [fmtLocalDateTime](/lib/tokens/quota-stats-format/fmtLocalDateTime.md) | Function | `lib/tokens/quota-stats-format.ts` | Format a timestamp as human-readable local time: "HH:MM YYYY… |
| [cellWidth](/lib/tokens/markdown-table/cellWidth.md) | Function | `lib/tokens/markdown-table.ts` | Calculate cell width based on the specified mode. |

## Usage with OpenCode

```bash
# Prime full context
RUN cat ./okf_bundle/SUMMARY.md

# Prime specific domain
RUN cat ./okf_bundle/build-plugins.mjs/index.md

# Find a concept
RUN find ./okf_bundle -name '<ConceptName>.md' | xargs cat
```
