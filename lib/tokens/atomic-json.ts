import { mkdir, rename, rm, writeFile } from "fs/promises";
import { dirname } from "path";
import { stringifyWithComments } from "./jsonc";

export interface WriteJsonAtomicOptions {
  trailingNewline?: boolean;
}

async function safeRm(target: string): Promise<void> {
  try { await rm(target, { force: true }); } catch {}
}

export async function writeJsonAtomic(
  path: string,
  data: unknown,
  opts: WriteJsonAtomicOptions = {},
): Promise<void> {
  const dir = dirname(path);
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const content = stringifyWithComments(data) + (opts.trailingNewline ? "\n" : "");

  await mkdir(dir, { recursive: true });
  await writeFile(tmp, content, "utf-8");

  try {
    await rename(tmp, path);
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code) : "";
    if (code === "EPERM" || code === "EEXIST" || code === "EACCES" || code === "ENOTEMPTY") {
      await safeRm(path);
      await rename(tmp, path);
    } else {
      await safeRm(tmp);
      throw err;
    }
  }
}
