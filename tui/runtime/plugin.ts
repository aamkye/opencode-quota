import type { TuiDispose, TuiPluginApi, TuiPluginModule, TuiPluginOptions } from "@opencode-ai/plugin/tui"

import type { PluginManifestEntry } from "./manifest.js"

type FeatureCleanup = TuiDispose

export type TuiFeatureContext = {
  onCleanup(cleanup: FeatureCleanup): FeatureCleanup
}

export type FeatureActivation = (
  context: TuiFeatureContext,
  api: TuiPluginApi,
  options: TuiPluginOptions | undefined,
  meta: unknown,
) => void | FeatureCleanup | Promise<void | FeatureCleanup>

export function defineTuiPlugin(
  descriptor: PluginManifestEntry,
  activate: FeatureActivation,
): TuiPluginModule & { id: string } {
  return {
    id: descriptor.id,
    async tui(api, options, meta) {
      const cleanups: FeatureCleanup[] = []
      const context: TuiFeatureContext = {
        onCleanup(cleanup) {
          cleanups.push(cleanup)
          return cleanup
        },
      }

      let cleanupPromise: Promise<void> | undefined
      const cleanup = async (activationFailure?: { error: unknown }) => {
        cleanupPromise ??= (async () => {
          let cleanupError: unknown
          let hasCleanupError = false
          while (cleanups.length > 0) {
            const dispose = cleanups.pop()
            if (!dispose) continue
            try {
              await dispose()
            } catch (error) {
              if (!activationFailure && !hasCleanupError) {
                cleanupError = error
                hasCleanupError = true
              }
            }
          }
          if (activationFailure) throw activationFailure.error
          if (hasCleanupError) throw cleanupError
        })()

        return await cleanupPromise
      }

      let unregister: (() => void) | undefined

      try {
        const returnedCleanup = await activate(context, api, options, meta)
        if (returnedCleanup) cleanups.push(returnedCleanup)
        unregister = api.lifecycle.onDispose(() => cleanup())
      } catch (error) {
        try {
          unregister?.()
        } catch {
          // Preserve the original activation or registration failure.
        }
        return await cleanup({ error })
      }

      if (api.lifecycle.signal.aborted) {
        unregister?.()
        await cleanup()
      }
    },
  }
}
