import { spawnSync } from "node:child_process"

const commands = [
  ["tests/compile-presentation.mjs"],
  [
    "--test",
    "tests/shared-boundary.test.mjs",
    "tests/token-commands.test.mjs",
    "tests/provider-zai.test.mjs",
    "tests/provider-openai.test.mjs",
  ],
]

for (const args of commands) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
