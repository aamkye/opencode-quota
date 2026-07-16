import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createSignal } from "solid-js"

import { createOpenAiProvider } from "../tui/providers/openai.js"
import type { QuotaProviderAdapter, QuotaProviderOptions } from "../tui/providers/types.js"
import { createZaiProvider } from "../tui/providers/zai.js"

type ReactiveProvider = {
  adapter: QuotaProviderAdapter
  setCredential(key: string | null): void
}

function reactiveProviderApi(providerID: string, initialKey: string | null): {
  api: TuiPluginApi
  setCredential(key: string | null): void
} {
  const [providers, setProviders] = createSignal(
    initialKey ? [{ id: providerID, key: initialKey }] : [],
  )
  const api = {
    state: {
      get provider() {
        return providers()
      },
      session: { messages: () => [] },
      part: () => [],
    },
    kv: { get: () => undefined, set: () => undefined },
  } as unknown as TuiPluginApi

  return {
    api,
    setCredential(key: string | null): void {
      setProviders(key ? [{ id: providerID, key }] : [])
    },
  }
}

export function createReactiveOpenAiAdapter(
  initialKey: string | null,
  options: QuotaProviderOptions = {},
): ReactiveProvider {
  const host = reactiveProviderApi("openai", initialKey)
  return {
    adapter: createOpenAiProvider(host.api, options),
    setCredential: host.setCredential,
  }
}

export function createReactiveZaiAdapter(
  initialKey: string | null,
  options: QuotaProviderOptions = {},
): ReactiveProvider {
  const host = reactiveProviderApi("zai-coding-plan", initialKey)
  return {
    adapter: createZaiProvider(host.api, options),
    setCredential: host.setCredential,
  }
}
