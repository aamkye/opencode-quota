import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import ts from "typescript"

rmSync(".tmp-test", { recursive: true, force: true })
rmSync(".tmp-test-src", { recursive: true, force: true })
mkdirSync(".tmp-test", { recursive: true })
mkdirSync(".tmp-test-src", { recursive: true })

const source = readFileSync("opencode-quota-shared.tsx", "utf8")
  .replace(/^\/\*\* @jsxImportSource @opentui\/solid \*\/\n/, "")

writeFileSync(".tmp-test-src/opencode-quota-shared.tsx", source)

const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.React,
    jsxFactory: "jsx",
    jsxFragmentFactory: "Fragment",
  },
}).outputText

writeFileSync(".tmp-test/opencode-quota-shared.js", output)
