import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import ts from "typescript"

mkdirSync(".tmp-test", { recursive: true })

const source = readFileSync("lib/session-title.ts", "utf8")
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText

writeFileSync(".tmp-test/session-title.js", output)
