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
