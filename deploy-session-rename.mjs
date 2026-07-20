import { spawnSync } from "node:child_process"
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const build = spawnSync(process.execPath, ["build-session-rename.mjs"], { stdio: "inherit" })
if (build.status !== 0) process.exit(build.status ?? 1)

const source = "dist/session-rename.ts"
const destinationDirectory = join(homedir(), ".config", "opencode", "plugins")
const destination = join(destinationDirectory, "session-rename.ts")
const legacyDestination = join(destinationDirectory, "session-title.ts")

mkdirSync(destinationDirectory, { recursive: true })
copyFileSync(source, destination)

if (!readFileSync(source).equals(readFileSync(destination))) {
  throw new Error(`installed plugin differs from ${source}`)
}

rmSync(legacyDestination, { force: true })
console.log(`Installed ${destination}`)
console.log(`Removed legacy ${legacyDestination}`)
