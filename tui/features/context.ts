import type { AssistantMessage, Message, Provider } from "@opencode-ai/sdk/v2"

import { formatCount, formatCurrency } from "../presentation/format.js"

export type ContextMessage = Pick<Message, "role"> & Partial<Pick<
  AssistantMessage,
  "providerID" | "modelID" | "cost" | "tokens"
>>

export type ContextProvider = Pick<Provider, "id"> & {
  models: Record<string, {
    limit?: Partial<Pick<Provider["models"][string]["limit"], "context">>
  }>
}

export type ContextPanelModel = {
  tokens: string
  used: string
  spent: string
  summary: string
}

function finite(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function messageTokens(message: ContextMessage): number {
  const tokens = message.tokens
  if (!tokens) return 0
  return finite(tokens.input)
    + finite(tokens.output)
    + finite(tokens.reasoning)
    + finite(tokens.cache?.read)
    + finite(tokens.cache?.write)
}

export function createContextPanelModel(
  messages: readonly ContextMessage[],
  providers: readonly ContextProvider[],
): ContextPanelModel {
  let spent = 0
  let selected: { message: ContextMessage; tokens: number } | undefined

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role !== "assistant") continue
    spent += finite(message.cost)
    if (!selected) {
      const tokens = messageTokens(message)
      if (tokens > 0) selected = { message, tokens }
    }
  }

  const unavailable = { tokens: "-", used: "-", spent: formatCurrency(spent), summary: "-" }
  if (!selected) return unavailable

  const provider = providers.find((candidate) => candidate.id === selected.message.providerID)
  const limit = selected.message.modelID
    ? provider?.models[selected.message.modelID]?.limit?.context
    : undefined
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) return unavailable

  const used = `${Math.round((selected.tokens / limit) * 100)}%`
  return {
    tokens: formatCount(limit),
    used,
    spent: formatCurrency(spent),
    summary: used,
  }
}
