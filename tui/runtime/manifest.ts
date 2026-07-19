import manifest from "../../plugin-manifest.json"

export type PluginKey = "quota" | "home" | "token-report" | "mcp" | "context" | "lsp" | "todo" | "ses-tokens" | "subagent"
export type PluginManifestEntry = {
  key: PluginKey
  id: string
  source: string
  outfile: string
  slotOrder?: number
  options: "quota" | "none"
}

export const pluginManifest = manifest as readonly PluginManifestEntry[]

export function pluginDescriptor(key: PluginKey): PluginManifestEntry {
  const descriptor = pluginManifest.find((entry) => entry.key === key)
  if (!descriptor) throw new Error(`missing plugin descriptor: ${key}`)
  return descriptor
}
