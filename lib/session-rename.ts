import type { Hooks, PluginInput } from "@opencode-ai/plugin"

type SessionRenameModel = { providerID: string; modelID: string; variant?: string }

export type SessionMessage = {
  info: {
    id: string
    role: string
    model?: SessionRenameModel
  }
  parts?: readonly { type: string; text?: string }[]
}

const TITLE = /^[\p{L}\p{N}][\p{L}\p{N}'-]*(?: [\p{L}\p{N}][\p{L}\p{N}'-]*){2,7}$/u
const TITLE_SYSTEM = "Return only a plain-text session title of 3 to 8 words. No quotes, Markdown, punctuation, or explanation."
const HANDLED_SESSION_RENAME = new Error("session rename handled")

type Client = PluginInput["client"]
type Warn = (action: string, sessionID: string, error: unknown) => void

export function normalizeTitle(value: string): string | undefined {
  const title = value.trim().replace(/^['"]|['"]$/g, "")
  return TITLE.test(title) ? title : undefined
}

export function describeInvalidTitle(value: string): string {
  const title = value.trim().replace(/^['"]|['"]$/g, "")
  const words = title.length === 0 ? [] : title.split(/\s+/).filter(Boolean)

  if (words.length < 3 || words.length > 8) {
    return `The session name "${title}" is invalid: it must be 3 to 8 words, but has ${words.length}.`
  }

  return `The session name "${title}" is invalid: each word must start with a letter or number and contain only letters, numbers, apostrophes, and hyphens.`
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

function resolveLatestUserModel(messages: readonly SessionMessage[]): { model: SessionRenameModel; variant?: string } | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    const model = message.info.model
    if (message.info.role === "user" && model?.providerID && model.modelID) {
      return {
        model: { providerID: model.providerID, modelID: model.modelID },
        variant: model.variant,
      }
    }
  }
}

export function createSessionRenameHooks(client: Client, warn: Warn = logWarning): Hooks {
  async function reportError(sessionID: string, text: string): Promise<void> {
    const result = await client.session.prompt({
      path: { id: sessionID },
      body: {
        noReply: true,
        parts: [{ type: "text", text, ignored: true }],
      },
    })
    if (result.error !== undefined) throw result.error
  }

  async function generateTitle(
    parentID: string,
    model: SessionRenameModel | undefined,
    variant: string | undefined,
    request: string,
  ): Promise<string | undefined> {
    let childID: string | undefined
    let candidate: string | undefined
    let failed = false

    try {
      if (!model?.providerID || !model.modelID) throw new Error("selected model is unavailable")

      const created = await client.session.create({ body: { parentID, title: "Session title" } })
      if (!created.data) throw new Error("child session was not created")
      childID = created.data.id
      if (!request) throw new Error("rename context has no text")

      const response = await client.session.prompt({
        path: { id: childID },
        body: {
          model,
          ...(variant === undefined ? {} : { variant }),
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
          const result = await client.session.delete({ path: { id: childID } })
          if (result.error !== undefined) throw result.error
        } catch (error) {
          failed = true
          warn("cleanup", parentID, error)
        }
      }
    }

    return failed ? undefined : candidate
  }

  return {
    async config(config) {
      config.command ??= {}
      config.command["session-rename"] ??= {
        template: "/session-rename",
        description: "Rename this session; omit the title to generate one",
      }
      config.agent ??= {}
      config.agent.title = { ...config.agent.title, disable: true }
    },
    async "command.execute.before"(input) {
      if (input.command.replace(/^\//, "") !== "session-rename") return

      if (!input.arguments.trim()) {
        try {
          const messages = await client.session.messages({ path: { id: input.sessionID } })
          if (!messages.data) throw new Error("session messages are unavailable")
          const context = collectRecentUserText(messages.data, 8_000)
          if (!context) throw new Error("recent user text is unavailable")
          const selection = resolveLatestUserModel(messages.data)
          if (!selection) throw new Error("recent user model is unavailable")

          const title = await generateTitle(input.sessionID, selection.model, selection.variant, context)
          if (!title) throw new Error("generated title is unavailable")

          try {
            const result = await client.session.update({ path: { id: input.sessionID }, body: { title } })
            if (result.error !== undefined) throw result.error
          } catch (error) {
            warn("update", input.sessionID, error)
          }
        } catch (error) {
          if (error instanceof Error && error.message !== "generated title is unavailable") {
            warn("generate", input.sessionID, error)
          }
        }

        throw HANDLED_SESSION_RENAME
      }

      const title = normalizeTitle(input.arguments)

      if (title) {
        try {
          const result = await client.session.update({ path: { id: input.sessionID }, body: { title } })
          if (result.error !== undefined) throw result.error
        } catch (error) {
          warn("update", input.sessionID, error)
        }
        throw HANDLED_SESSION_RENAME
      }

      try {
        await reportError(input.sessionID, describeInvalidTitle(input.arguments))
      } catch (error) {
        warn("feedback", input.sessionID, error)
      }
      throw HANDLED_SESSION_RENAME
    },
  }
}

function logWarning(action: string, sessionID: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  console.warn(JSON.stringify({ plugin: "session-rename", action, sessionID, message }))
}
