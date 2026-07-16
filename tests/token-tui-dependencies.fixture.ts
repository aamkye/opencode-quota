export { TOKEN_REPORT_COMMANDS } from "../lib/tokens/token-commands.js"

export async function computeTokenReport(params: unknown): Promise<unknown> {
  const compute = (globalThis as { __tokenTuiCompute?: (params: unknown) => Promise<unknown> }).__tokenTuiCompute
  if (!compute) throw new Error("Controlled token report computation was not configured")
  return compute(params)
}
