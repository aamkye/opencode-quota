declare module "@opencode-ai/plugin/tui" {
  import type { JSX } from "@opentui/solid"
  import type { Provider } from "@opencode-ai/sdk/v2"

  export interface TuiPluginApi {
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
    kv: {
      get<T>(key: string): T | undefined
      get<T>(key: string, fallback: T): T
      set<T>(key: string, value: T): void
    }
  }

  export type TuiPluginOptions = Record<string, unknown>

  export type TuiPlugin = (api: TuiPluginApi, options: TuiPluginOptions) => void | Promise<void>

  export interface TuiPluginModule {
    tui: TuiPlugin
  }
}

declare module "bun:sqlite";
declare module "better-sqlite3";
