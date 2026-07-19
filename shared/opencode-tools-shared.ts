import { createOpenAiProvider } from "../tui/providers/openai.js";
import {
  composeQuotaPanel,
  createQuotaSelection,
  normalizeQuotaOptions,
  quotaProviderDemand,
  selectedQuotaProviderID,
  selectedSessionQuotaProviderID,
} from "../tui/features/quota.js";
import { createOpenCodeGoProvider } from "../tui/providers/opencode-go.js";
import { pluginDescriptor } from "../tui/runtime/manifest.js";
import { createZaiProvider } from "../tui/providers/zai.js";

export { CompactPanel, CompactStatusRow } from "../tui/presentation/compact-panel.js";
export type {
  CompactPanelProps,
  CompactPanelSummary,
  CompactStatusRowProps,
  PanelTheme,
} from "../tui/presentation/compact-panel.js";
export type { PanelStatus } from "../tui/presentation/types.js";
export { allocateStatusRow } from "../tui/presentation/layout.js";
export type { StatusRowAllocation } from "../tui/presentation/layout.js";
export { createMcpPanelModel } from "../tui/features/mcp.js";
export type { McpPanelModel, McpStatusRow } from "../tui/features/mcp.js";
export { createContextPanelModel } from "../tui/features/context.js";
export type {
  ContextMessage,
  ContextPanelModel,
  ContextProvider,
} from "../tui/features/context.js";
export { createLspPanelModel } from "../tui/features/lsp.js";
export type { LspPanelModel, LspStatusRow } from "../tui/features/lsp.js";
export { createTodoPanelModel } from "../tui/features/todo.js";
export type { TodoPanelModel, TodoStatusRole, TodoStatusRow } from "../tui/features/todo.js";
export { createSesTokensPanelModel } from "../tui/features/ses-tokens.js";
export type { SesTokenTotals, SesTokensMessage, SesTokensPanelModel } from "../tui/features/ses-tokens.js";
export { allocateSubagentEntryRow, createSubagentPanelModel } from "../tui/features/subagent.js";
export type {
  SubagentEntry,
  SubagentEntryRowAllocation,
  SubagentPanelModel,
  SubagentStatus,
} from "../tui/features/subagent.js";
export type { SubagentChildSnapshot, SubagentSnapshot } from "../tui/services/subagent-snapshot.js";
export {
  collectSessionTreeIDs,
  createSessionTreeSnapshotLoader,
  indexSessionsByParent,
  loadSessionTreeSnapshot,
} from "../tui/services/session-tree-snapshot.js";
export type {
  CreateSessionTreeSnapshotLoaderOptions,
  LoadSessionTreeSnapshotOptions,
  SessionTreeRecord,
  SessionTreeSnapshot,
  SessionTreeSnapshotLoadContext,
  SessionTreeSnapshotLoader,
} from "../tui/services/session-tree-snapshot.js";
export { createSesTokensSource } from "../tui/services/ses-tokens-source.js";
export type {
  SesTokensEventRegistrar,
  SesTokensRefreshEvent,
  SesTokensSource,
  SesTokensSourceDependencies,
  SesTokensSourceState,
} from "../tui/services/ses-tokens-source.js";
export { createOpenAiProvider };
export {
  acquireQuotaProviderHub,
  createQuotaProviderHub,
} from "../tui/services/quota-provider-hub.js";
export {
  createOpenCodeGoProvider,
  fetchOpenCodeGoQuota,
  mapOpenCodeGoPanelState,
  normalizeOpenCodeGoConfig,
  openCodeGoHomeQuotaSummary,
  parseOpenCodeGoHydration,
} from "../tui/providers/opencode-go.js";
export type {
  OpenCodeGoConfig,
  OpenCodeGoFetchDependencies,
  OpenCodeGoFetchResult,
  OpenCodeGoOptions,
  OpenCodeGoPanelPhase,
  OpenCodeGoPanelState,
  OpenCodeGoProviderOptions,
  OpenCodeGoQuotaData,
  OpenCodeGoWindow,
} from "../tui/providers/opencode-go.js";
export { createZaiProvider };
export type {
  HomeQuotaSummary,
  OpenAiHomeQuotaSummary,
  OpenCodeGoHomeQuotaSummary,
  ProviderFreshness,
  QuotaProviderAdapter,
  ZaiHomeQuotaSummary,
} from "../tui/providers/types.js";
export type {
  QuotaProviderDemand,
  QuotaProviderHub,
} from "../tui/services/quota-provider-hub.js";
export {
  composeQuotaPanel,
  createQuotaSelection,
  normalizeQuotaOptions,
  quotaProviderDemand,
  selectedQuotaProviderID,
  selectedSessionQuotaProviderID,
};
export type {
  NormalizedQuotaOptions,
  PercentageMode,
  ProgressColorOptions,
  QuotaCompositionOptions,
  QuotaPluginOptions,
  QuotaSelection,
  SortDirection,
} from "../tui/features/quota.js";
export {
  formatHomeQuotaLine,
  homeQuotaPercentParts,
  homeQuotaStatusRole,
} from "../tui/features/home.js";
export {
  activeSessionID,
  persistTokenReport,
} from "../tui/features/token-report.js";

export type QuotaAdapterShared = {
  sidebarSlotOrder: typeof quotaSidebarSlotOrder;
  normalizeOptions: typeof normalizeQuotaOptions;
  composePanel: typeof composeQuotaPanel;
  createSelection: typeof createQuotaSelection;
  quotaProviderDemand: typeof quotaProviderDemand;
  createZaiProvider: typeof createZaiProvider;
  createOpenAiProvider: typeof createOpenAiProvider;
  createOpenCodeGoProvider: typeof createOpenCodeGoProvider;
};

export const quotaSidebarSlotOrder = pluginDescriptor("quota").slotOrder;

export const quotaAdapterShared: QuotaAdapterShared = {
  sidebarSlotOrder: quotaSidebarSlotOrder,
  normalizeOptions: normalizeQuotaOptions,
  composePanel: composeQuotaPanel,
  createSelection: createQuotaSelection,
  quotaProviderDemand,
  createZaiProvider,
  createOpenAiProvider,
  createOpenCodeGoProvider,
};

export {
  getCommandTitle,
  isTokenReportCommand,
  TOKEN_REPORT_COMMANDS,
} from "../lib/tokens/token-commands";
export type {
  TokenReportCommandId,
  TokenReportCommandSpec,
} from "../lib/tokens/token-commands";
export { computeTokenReport } from "../lib/tokens/token-report-data";
export { renderTokenReport } from "../lib/tokens/token-report-presenter";
export type {
  ComputeTokenReportDependencies,
  ComputeTokenReportParams,
  TokenReportData,
} from "../lib/tokens/token-report-data";
export { acquireService, defineTuiPlugin } from "../tui/runtime/plugin.js";
export type { FeatureActivation, ServiceFactory, ServiceKey, ServiceLease, ServiceValue, TuiFeatureContext } from "../tui/runtime/plugin.js";
export { pluginDescriptor, pluginManifest } from "../tui/runtime/manifest.js";
export type { PluginKey, PluginManifestEntry } from "../tui/runtime/manifest.js";
