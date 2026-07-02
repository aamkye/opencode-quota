import { homedir } from "os";
import { join } from "path";

export interface OpencodeRuntimeDirs {
  dataDir: string;
  configDir: string;
  cacheDir: string;
  stateDir: string;
}

export interface OpencodeRuntimeDirCandidates {
  dataDirs: string[];
  configDirs: string[];
  cacheDirs: string[];
  stateDirs: string[];
}

function dedupe(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (!item) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

export function getOpencodeRuntimeDirs(params?: {
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
}): OpencodeRuntimeDirs {
  const env = params?.env ?? process.env;
  const home = params?.homeDir ?? homedir();

  const dataBase = env.XDG_DATA_HOME?.trim() || join(home, ".local", "share");
  const configBase = env.XDG_CONFIG_HOME?.trim() || join(home, ".config");
  const cacheBase = env.XDG_CACHE_HOME?.trim() || join(home, ".cache");
  const stateBase = env.XDG_STATE_HOME?.trim() || join(home, ".local", "state");

  return {
    dataDir: join(dataBase, "opencode"),
    configDir: join(configBase, "opencode"),
    cacheDir: join(cacheBase, "opencode"),
    stateDir: join(stateBase, "opencode"),
  };
}

export function getOpencodeRuntimeDirCandidates(params?: {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  primary?: OpencodeRuntimeDirs;
}): OpencodeRuntimeDirCandidates {
  const platform = params?.platform ?? process.platform;
  const env = params?.env ?? process.env;
  const home = params?.homeDir ?? homedir();

  const primary = params?.primary ?? getOpencodeRuntimeDirs({ env, homeDir: home });

  const dataDirs: string[] = [primary.dataDir];
  const configDirs: string[] = [primary.configDir];
  const cacheDirs: string[] = [primary.cacheDir];
  const stateDirs: string[] = [primary.stateDir];

  if (platform === "darwin" || platform !== "win32") {
    dataDirs.push(join(home, ".local", "share", "opencode"));
    configDirs.push(join(home, ".config", "opencode"));
    cacheDirs.push(join(home, ".cache", "opencode"));
    stateDirs.push(join(home, ".local", "state", "opencode"));
  }

  if (platform === "darwin") {
    dataDirs.push(join(home, "Library", "Application Support", "opencode"));
    configDirs.push(join(home, "Library", "Application Support", "opencode"));
    cacheDirs.push(join(home, "Library", "Caches", "opencode"));
  }

  return {
    dataDirs: dedupe(dataDirs),
    configDirs: dedupe(configDirs),
    cacheDirs: dedupe(cacheDirs),
    stateDirs: dedupe(stateDirs),
  };
}
