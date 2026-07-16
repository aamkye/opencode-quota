import type { TuiDispose, TuiPluginApi, TuiPluginModule, TuiPluginOptions } from "@opencode-ai/plugin/tui"

import type { PluginManifestEntry } from "./manifest.js"

type FeatureCleanup = TuiDispose

export type ServiceKey = PropertyKey
export type ServiceValue<T> = T extends object | FeatureCleanup ? T & { dispose?: FeatureCleanup } : T
export type ServiceFactory<T> = () => ServiceValue<T>
export type ServiceLease<T> = {
  value: ServiceValue<T>
  release(): void | Promise<void>
}

type ServiceRecord<T> = {
  value: ServiceValue<T>
  references: number
  dispose?: FeatureCleanup
}

const apiServices = new WeakMap<TuiPluginApi, Map<ServiceKey, ServiceRecord<unknown>>>()

function serviceDisposeOf(value: unknown): FeatureCleanup | undefined {
  if ((!value || typeof value !== "object") && typeof value !== "function") return undefined
  const dispose = (value as { dispose?: unknown }).dispose
  return typeof dispose === "function" ? dispose.bind(value) : undefined
}

export function acquireService<T>(
  api: TuiPluginApi,
  key: ServiceKey,
  factory: ServiceFactory<T>,
): ServiceLease<T> {
  let services = apiServices.get(api)
  let record = services?.get(key) as ServiceRecord<T> | undefined

  if (!record) {
    const value = factory()
    record = { value, references: 0, dispose: serviceDisposeOf(value) }
    services ??= new Map()
    services.set(key, record)
    apiServices.set(api, services)
  }

  record.references += 1
  let released = false

  return {
    value: record.value,
    async release() {
      if (released) return
      released = true
      const activeServices = apiServices.get(api)
      if (!activeServices || activeServices.get(key) !== record) return
      record.references -= 1
      if (record.references > 0) return
      activeServices.delete(key)
      if (activeServices.size === 0) apiServices.delete(api)
      await record.dispose?.()
    },
  }
}

export type TuiFeatureContext = {
  onCleanup(cleanup: FeatureCleanup): FeatureCleanup
  acquireService<T>(key: ServiceKey, factory: ServiceFactory<T>): ServiceLease<T>
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
        acquireService(key, factory) {
          const lease = acquireService(api, key, factory)
          cleanups.push(lease.release)
          return lease
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
