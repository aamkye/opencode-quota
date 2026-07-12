import { spawnSync } from "node:child_process"
import { copyFileSync, mkdirSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const build = spawnSync(process.execPath, ["build-session-title.mjs"], { stdio: "inherit" })
if (build.status !== 0) process.exit(build.status ?? 1)

const source = "dist/session-title.ts"
const destinationDirectory = join(homedir(), ".config", "opencode", "plugins")
const destination = join(destinationDirectory, "session-title.ts")

mkdirSync(destinationDirectory, { recursive: true })
copyFileSync(source, destination)

if (!readFileSync(source).equals(readFileSync(destination))) {
  throw new Error(`installed plugin differs from ${source}`)
}

console.log(`Installed ${destination}`)
