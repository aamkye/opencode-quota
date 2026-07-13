import type { Hooks, PluginInput } from "@opencode-ai/plugin"

export type SessionMessage = {
  info: { id: string; role: string }
  parts?: readonly { type: string; text?: string }[]
}

export type TitleStage = "checking" | "generating" | "ready" | "updating" | "handled"

type TitleRecord = {
  stage: TitleStage
  childID?: string
  candidate?: string
  idleSeen: boolean
}

const TITLE = /^[\p{L}\p{N}][\p{L}\p{N}'-]*(?: [\p{L}\p{N}][\p{L}\p{N}'-]*){2,7}$/u
const TITLE_SYSTEM = "Return only a plain-text session title of 3 to 8 words. No quotes, Markdown, punctuation, or explanation."

type Client = PluginInput["client"]
type Warn = (action: string, sessionID: string, error: unknown) => void

export function normalizeTitle(value: string): string | undefined {
  const title = value.trim().replace(/^['"]|['"]$/g, "")
  return TITLE.test(title) ? title : undefined
}

export function hasPriorParentMessages(
  messages: readonly SessionMessage[],
  currentMessageID: string,
): boolean {
  return messages.some((message) => message.info.id !== currentMessageID && message.info.role === "user")
}

export function collectRecentUserText(
  messages: readonly SessionMessage[],
  maxCharacters = 8_000,
): string | undefined {
  const fragments: string[] = []
  let remaining = Math.max(0, Math.floor(maxCharacters))

  for (let index = messages.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const message = messages[index]
    if (message.info.role !== "user") continue

    const text = message.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text?.trim())
      .filter((part): part is string => Boolean(part))
      .join("\n")
    if (!text) continue

    const separatorLength = fragments.length > 0 ? 1 : 0
    const available = remaining - separatorLength
    if (available <= 0) continue

    const fragment = text.slice(-available)
    fragments.push(fragment)
    remaining -= fragment.length + separatorLength
  }

  const context = fragments.reverse().join("\n")
  return context || undefined
}

export class TitleState {
  #parents = new Map<string, TitleRecord>()
  #children = new Set<string>()
  #handledParents = new Set<string>()

  claim(parentID: string): boolean {
    if (this.#parents.has(parentID) || this.#handledParents.has(parentID)) return false
    this.#parents.set(parentID, { stage: "checking", idleSeen: false })
    return true
  }

  beginGeneration(parentID: string): void {
    const record = this.#record(parentID, "checking")
    record.stage = "generating"
  }

  registerChild(parentID: string, childID: string): void {
    this.beginGeneration(parentID)
    const record = this.#record(parentID, "generating")
    record.childID = childID
    this.#children.add(childID)
  }

  complete(parentID: string, candidate: string): string | undefined {
    const record = this.#record(parentID, "generating")
    record.candidate = candidate
    if (!record.idleSeen) {
      record.stage = "ready"
      return undefined
    }
    record.stage = "updating"
    return candidate
  }

  fail(parentID: string): void {
    if (!this.#parents.delete(parentID)) return
    this.#handledParents.add(parentID)
  }

  onFirstIdle(parentID: string): string | undefined {
    const record = this.#parents.get(parentID)
    if (!record || record.idleSeen || record.stage === "handled") return undefined
    record.idleSeen = true
    if (record.stage !== "ready" || !record.candidate) return undefined
    record.stage = "updating"
    return record.candidate
  }

  finishUpdate(parentID: string): void {
    this.fail(parentID)
  }

  releaseChild(childID: string): void {
    this.#children.delete(childID)
  }

  isChild(sessionID: string): boolean {
    return this.#children.has(sessionID)
  }

  stage(parentID: string): TitleStage | undefined {
    return this.#parents.get(parentID)?.stage
  }

  #record(parentID: string, expected: TitleStage): TitleRecord {
    const record = this.#parents.get(parentID)
    if (!record || record.stage !== expected) throw new Error(`invalid title state for ${parentID}`)
    return record
  }
}

export function createSessionTitleHooks(client: Client, warn: Warn = logWarning): Hooks {
  const state = new TitleState()

  function resolveModel(input: Parameters<NonNullable<Hooks["chat.message"]>>[0], output: Parameters<NonNullable<Hooks["chat.message"]>>[1]) {
    const inputModel = input.model
    const outputModel = output.message.model
    return inputModel?.providerID && inputModel.modelID
      ? inputModel
      : outputModel?.providerID && outputModel.modelID
        ? outputModel
        : undefined
  }

  async function generateTitle(
    parentID: string,
    input: Parameters<NonNullable<Hooks["chat.message"]>>[0],
    output: Parameters<NonNullable<Hooks["chat.message"]>>[1],
  ): Promise<string | undefined> {
    let childID: string | undefined
    let candidate: string | undefined
    let failed = false

    try {
      const model = resolveModel(input, output)
      if (!model) throw new Error("selected model is unavailable")

      const created = await client.session.create({ body: { parentID, title: "Session title" } })
      if (!created.data) throw new Error("child session was not created")
      childID = created.data.id
      state.registerChild(parentID, childID)

      const request = output.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text.trim())
        .filter(Boolean)
        .join("\n")
      if (!request) throw new Error("first message has no text")

      const response = await client.session.prompt({
        path: { id: childID },
        body: {
          model,
          ...(input.variant === undefined ? {} : { variant: input.variant }),
          tools: {},
          system: TITLE_SYSTEM,
          parts: [{ type: "text", text: `Generate a title for this request:\n\n${request}` }],
        },
      })
      const text = response.data?.parts.find((part) => part.type === "text")
      candidate = text?.type === "text" ? normalizeTitle(text.text) : undefined
      if (!candidate) throw new Error("generated title is invalid")
    } catch (error) {
      failed = true
      warn("generate", parentID, error)
    } finally {
      if (childID) {
        try {
          await client.session.delete({ path: { id: childID } })
        } catch (error) {
          failed = true
          warn("cleanup", parentID, error)
        } finally {
          state.releaseChild(childID)
        }
      }
    }

    return failed ? undefined : candidate
  }

  async function update(parentID: string, title: string): Promise<void> {
    try {
      await client.session.update({ path: { id: parentID }, body: { title } })
    } catch (error) {
      warn("update", parentID, error)
    } finally {
      state.finishUpdate(parentID)
    }
  }

  return {
    async config(config) {
      config.agent ??= {}
      config.agent.title = { ...config.agent.title, disable: true }
    },
    async "chat.message"(input, output) {
      const parentID = input.sessionID
      if (state.isChild(parentID) || !state.claim(parentID)) return

      const currentMessageID = input.messageID ?? output.message.id

      try {
        const messages = await client.session.messages({ path: { id: parentID } })
        if (!messages.data) throw new Error("prior messages are unavailable")
        if (hasPriorParentMessages(messages.data, currentMessageID)) {
          state.fail(parentID)
          return
        }
      } catch (error) {
        warn("generate", parentID, error)
        state.fail(parentID)
        return
      }

      const candidate = await generateTitle(parentID, input, output)
      if (!candidate) {
        state.fail(parentID)
        return
      }

      const title = state.complete(parentID, candidate)
      if (title) await update(parentID, title)
    },
    async event({ event }) {
      if (event.type !== "session.idle" || state.isChild(event.properties.sessionID)) return
      const title = state.onFirstIdle(event.properties.sessionID)
      if (title) await update(event.properties.sessionID, title)
    },
  }
}

function logWarning(action: string, sessionID: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  console.warn(JSON.stringify({ plugin: "session-title", action, sessionID, message }))
}
