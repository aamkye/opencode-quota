# Secondary Provider Divider Design

## Problem

The quota composition flattens every secondary provider into the collapsible
`Other providers` group. The renderer draws separators only between groups, so
adjacent providers inside that group have no visual boundary.

## Design

Add `divider` to the generic `PanelItem` union. The presentation normalizer and
both render paths will preserve it as a semantic row. The mounted renderer will
draw the row with the existing flexible `GroupDivider` component, producing
left- and right-aligned `---` markers without exceeding the panel width.

`composeQuotaPanel` will insert one divider before each secondary provider after
the first. It will not add a divider before the first provider or after the last.
The divider belongs to the existing `Other providers` group, so collapsing that
group continues to hide all secondary providers together.

The generic renderer will not infer provider boundaries from header text or
provider IDs. Providers request separators through the semantic item type.

## Compatibility

The change does not alter provider sorting, quota values, status colors,
selected-provider groups, collapsed summaries, or the 37-column layout. A
single secondary provider renders without an internal divider. Two or more
secondary providers render one divider at each provider boundary.

## Testing

Add a composition regression that creates OpenCode Go and Z.AI as secondary
providers and asserts one divider appears between their complete item blocks.
Assert stable IDs and ordering so sorting cannot detach the divider from the
provider that follows it.

Extend presentation coverage to verify the semantic divider normalizes and
renders as a divider row at constrained width. Run focused composition and
presentation tests, typechecking, the complete suite, and production build and
deployment gates before redeploying locally.
