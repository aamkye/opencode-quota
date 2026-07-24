import assert from "node:assert/strict"
import test from "node:test"
import { resolveChipOption, resolveCollapseDefault } from "../.tmp-test/collapse-options.mjs"

test("returns expanded for undefined options", () => {
  assert.deepEqual(resolveCollapseDefault(undefined, false), { collapsed: false, secondaryCollapsed: false })
  assert.deepEqual(resolveCollapseDefault(undefined, true), { collapsed: false, secondaryCollapsed: false })
})

test("returns collapsed for collapsed state", () => {
  assert.deepEqual(resolveCollapseDefault({ defaultState: "collapsed" }, false), { collapsed: true, secondaryCollapsed: false })
  assert.deepEqual(resolveCollapseDefault({ defaultState: "collapsed" }, true), { collapsed: true, secondaryCollapsed: false })
})

test("returns expanded for expanded state", () => {
  assert.deepEqual(resolveCollapseDefault({ defaultState: "expanded" }, false), { collapsed: false, secondaryCollapsed: false })
  assert.deepEqual(resolveCollapseDefault({ defaultState: "expanded" }, true), { collapsed: false, secondaryCollapsed: false })
})

test("semi-collapsed is ignored for binary panels", () => {
  assert.deepEqual(resolveCollapseDefault({ defaultState: "semi-collapsed" }, false), { collapsed: false, secondaryCollapsed: false })
})

test("semi-collapsed expands panel but collapses secondary section for tri-state panels", () => {
  assert.deepEqual(resolveCollapseDefault({ defaultState: "semi-collapsed" }, true), { collapsed: false, secondaryCollapsed: true })
})

test("unrecognized values fall back to expanded", () => {
  assert.deepEqual(resolveCollapseDefault({ defaultState: "bogus" }, true), { collapsed: false, secondaryCollapsed: false })
  assert.deepEqual(resolveCollapseDefault({ defaultState: 42 }, false), { collapsed: false, secondaryCollapsed: false })
})

test("resolveChipOption defaults to enabled when the option is absent", () => {
  assert.equal(resolveChipOption(undefined, true).enabled, true)
  assert.equal(resolveChipOption({}, true).enabled, true)
})

test("resolveChipOption respects explicit disabled", () => {
  assert.equal(resolveChipOption({ chip: "disabled" }, true).enabled, false)
})

test("resolveChipOption honors explicit enabled", () => {
  assert.equal(resolveChipOption({ chip: "enabled" }, false).enabled, true)
})

test("resolveChipOption falls back to the default for unrecognized values", () => {
  assert.equal(resolveChipOption({ chip: "bogus" }, true).enabled, true)
  assert.equal(resolveChipOption({ chip: "bogus" }, false).enabled, false)
  assert.equal(resolveChipOption({ chip: 42 }, true).enabled, true)
})
