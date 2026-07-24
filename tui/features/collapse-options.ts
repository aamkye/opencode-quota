export type PanelCollapseState = "expanded" | "semi-collapsed" | "collapsed"

export type ResolvedCollapseDefault = {
  collapsed: boolean
  secondaryCollapsed: boolean
}

export function resolveCollapseDefault(
  options: Record<string, unknown> | undefined,
  supportsSemiCollapsed: boolean,
): ResolvedCollapseDefault {
  const raw = options?.defaultState
  if (raw === "collapsed") return { collapsed: true, secondaryCollapsed: false }
  if (raw === "semi-collapsed" && supportsSemiCollapsed) {
    return { collapsed: false, secondaryCollapsed: true }
  }
  return { collapsed: false, secondaryCollapsed: false }
}

export type ResolvedChipOption = {
  enabled: boolean
}

export function resolveChipOption(
  options: Record<string, unknown> | undefined,
  defaultEnabled: boolean,
): ResolvedChipOption {
  const raw = options?.chip
  if (raw === "disabled") return { enabled: false }
  if (raw === "enabled") return { enabled: true }
  return { enabled: defaultEnabled }
}
