// This script is deprecated. Session-rename is now deployed by deploy-plugins.mjs.
// Run `npm run deploy:global` or `npm run deploy:local` instead.
import { resolveGlobalConfigRoot, deployPlugins } from "./deploy-plugins.mjs"

await deployPlugins(resolveGlobalConfigRoot())
console.log("Session-rename deployed (use npm run deploy:global or deploy:local instead)")
