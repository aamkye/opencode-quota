export type CursorQuotaPlan = "none" | "pro" | "pro-plus" | "ultra";

const QUOTA_PROVIDER_ID_SYNONYMS: Readonly<Record<string, string>> = {
  "github-copilot": "copilot",
  "copilot-chat": "copilot",
  "github-copilot-chat": "copilot",
  "cursor-acp": "cursor",
  "open-cursor": "cursor",
  "@rama_nigg/open-cursor": "cursor",
  claude: "anthropic",
  "claude-code": "anthropic",
  qwen: "qwen-code",
  alibaba: "alibaba-coding-plan",
  "nano-gpt": "nanogpt",
  minimax: "minimax-coding-plan",
  "minimax-cn": "minimax-china-coding-plan",
  "minimax-china": "minimax-china-coding-plan",
  "minimax-cn-coding-plan": "minimax-china-coding-plan",
  kimi: "kimi-for-coding",
  "kimi-for-code": "kimi-for-coding",
  "kimi-code": "kimi-for-coding",
  "deep-seek": "deepseek",
  "opencode-go-subscription": "opencode-go",
  "gemini-cli": "google-gemini-cli",
  "google-gemini": "google-gemini-cli",
  "opencode-gemini-auth": "google-gemini-cli",
  gemini: "google-gemini-cli",
  "opencode-agy-auth": "google-agy",
  "google-agy-auth": "google-agy",
  "glm-coding-plan": "zhipu",
  "zhipu-coding-plan": "zhipu",
  "zhipuai-coding-plan": "zhipu",
};

const QUOTA_PROVIDER_RUNTIME_IDS: Readonly<Record<string, readonly string[]>> = {
  anthropic: ["anthropic"],
  copilot: ["copilot", "github-copilot", "copilot-chat", "github-copilot-chat"],
  openai: ["openai", "chatgpt", "codex"],
  cursor: ["cursor", "cursor-acp"],
  "qwen-code": ["qwen-code"],
  "alibaba-coding-plan": ["alibaba-coding-plan"],
  synthetic: ["synthetic"],
  chutes: ["chutes", "chutes-ai"],
  "google-antigravity": ["google-antigravity", "google", "antigravity"],
  "google-gemini-cli": ["google-gemini-cli", "gemini-cli", "gemini", "opencode-gemini-auth", "google"],
  "google-agy": ["google-agy", "opencode-agy-auth", "google-agy-auth"],
  zai: ["zai", "glm", "zai-coding-plan"],
  zhipu: ["zhipu", "glm-coding-plan", "zhipu-coding-plan", "zhipuai-coding-plan"],
  nanogpt: ["nanogpt", "nano-gpt"],
  "minimax-coding-plan": ["minimax-coding-plan", "minimax"],
  "minimax-china-coding-plan": ["minimax-china-coding-plan", "minimax-cn-coding-plan", "minimax-cn", "minimax-china"],
  "kimi-for-coding": ["kimi-for-coding", "kimi", "kimi-code"],
  deepseek: ["deepseek"],
  "opencode-go": ["opencode-go"],
  "ollama-cloud": ["ollama-cloud"],
};

export function normalizeQuotaProviderId(id: string): string {
  const normalized = id.trim().toLowerCase();
  return QUOTA_PROVIDER_ID_SYNONYMS[normalized] ?? normalized;
}

export function getQuotaProviderRuntimeIds(id: string): readonly string[] {
  const normalized = normalizeQuotaProviderId(id);
  return [...new Set(QUOTA_PROVIDER_RUNTIME_IDS[normalized] ?? [])];
}
