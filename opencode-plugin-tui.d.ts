declare module "@opencode-ai/plugin/tui" {
  import type { JSX } from "@opentui/solid"
  import type { Event, Provider } from "@opencode-ai/sdk/v2"

  type MessageUpdatedEvent = Extract<Event, { type: "message.updated" }> & { id: string }
  type TuiEvent = Exclude<Event, { type: "message.updated" }> | MessageUpdatedEvent

  export interface TuiCommand {
    name: string
    title: string
    namespace: "palette"
    slashName: string
    run(): void | Promise<void>
  }

  export interface TuiBinding {
    key: string
    cmd: string | (() => void)
    desc: string
  }

  export interface TuiRoute {
    name: string
    render(): JSX.Element
  }

  export interface TuiPromptProps {
    title: string
    placeholder?: string
    onConfirm(value: string): void
  }

  export interface TuiPluginApi {
    keymap: {
      registerLayer(input: { mode?: string; commands?: TuiCommand[]; bindings?: TuiBinding[] }): void
    }
    mode: {
      push(mode: string): () => void
    }
    route: {
      current: { name: string; params?: Record<string, unknown> }
      register(routes: TuiRoute[]): void
      navigate(name: string, params?: Record<string, unknown>): void
    }
    ui: {
      toast(input: { message: string; title?: string }): void
      dialog: {
        replace(render: () => JSX.Element, onClose?: () => void): void
        clear(): void
      }
      DialogPrompt: (props: TuiPromptProps) => JSX.Element
    }
    client: {
      session: {
        prompt(input: {
          path: { id: string }
          body: { noReply: true; parts: Array<{ type: "text"; text: string }> }
        }): Promise<unknown>
      }
    }
    slots: {
      register(input: {
        order?: number
        slots: Record<string, (ctx: any, props: any) => JSX.Element | null>
      }): void
    }
    theme: {
      current: {
        error: string
        warning: string
        success: string
        text: string
        textMuted: string
      }
    }
    state: {
      provider: readonly Provider[]
      session: {
        messages(sessionID: string): readonly import("@opencode-ai/sdk/v2").Message[]
      }
      part(messageID: string): readonly import("@opencode-ai/sdk/v2").Part[]
    }
    event: {
      on<Type extends TuiEvent["type"]>(
        type: Type,
        handler: (event: Extract<TuiEvent, { type: Type }>) => void,
      ): () => void
    }
    kv: {
      get<T>(key: string): T | undefined
      get<T>(key: string, fallback: T): T
      set<T>(key: string, value: T): void
    }
    lifecycle: {
      readonly signal: AbortSignal
      onDispose(fn: TuiDispose): () => void
    }
  }

  export type TuiPluginOptions = Record<string, unknown>

  export type TuiDispose = () => void | Promise<void>

  export type TuiPlugin = (api: TuiPluginApi, options: TuiPluginOptions | undefined, meta: unknown) => Promise<void>

  export interface TuiPluginModule {
    tui: TuiPlugin
  }
}

declare module "bun:sqlite";
declare module "better-sqlite3";
