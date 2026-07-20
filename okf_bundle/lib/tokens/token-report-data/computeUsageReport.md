---
okf_version: "0.2"
type: Function
title: computeUsageReport
resource: lib/tokens/token-report-data.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/token-report-data/computeUsageReport
language: typescript
---

# computeUsageReport

## Signature

```typescript
function computeUsageReport(params: {
  title: string;
  sinceMs?: number;
  untilMs?: number;
  sessionID: string;
  topModels?: number;
  topSessions?: number;
  filterSessionID?: string;
  filterSessionIDs?: string[];
  sessionOnly?: boolean;
  reportKind?: "standard" | "session" | "session_tree";
  sessionTree?: { rootSessionID: string; nodes: SessionTreeNode[] };
  generatedAtMs: number;
}, dependencies: ComputeTokenReportDependencies): Promise<TokenReportData>
```

## Source
Lines 81–113 in `lib/tokens/token-report-data.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-report-data](/lib/tokens/token-report-data.md) |
| calls | [aggregateUsage](/lib/tokens/quota-stats/aggregateUsage.md) |
| called_by | [computeTokenReport](/lib/tokens/token-report-data/computeTokenReport.md) |
