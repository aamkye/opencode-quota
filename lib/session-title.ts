export type SessionMessage = { info: { id: string } }

export type TitleStage = "checking" | "generating" | "ready" | "updating" | "handled"

type TitleRecord = {
  stage: TitleStage
  childID?: string
  candidate?: string
  idleSeen: boolean
}

const TITLE = /^[\p{L}\p{N}][\p{L}\p{N}'-]*(?: [\p{L}\p{N}][\p{L}\p{N}'-]*){2,7}$/u

export function normalizeTitle(value: string): string | undefined {
  const title = value.trim().replace(/^['"]|['"]$/g, "")
  return TITLE.test(title) ? title : undefined
}

export function hasPriorParentMessages(
  messages: readonly SessionMessage[],
  currentMessageID: string,
): boolean {
  return messages.some((message) => message.info.id !== currentMessageID)
}

export class TitleState {
  #parents = new Map<string, TitleRecord>()
  #children = new Set<string>()

  claim(parentID: string): boolean {
    if (this.#parents.has(parentID)) return false
    this.#parents.set(parentID, { stage: "checking", idleSeen: false })
    return true
  }

  beginGeneration(parentID: string): void {
    const record = this.#record(parentID, "checking")
    record.stage = "generating"
  }

  registerChild(parentID: string, childID: string): void {
    this.beginGeneration(parentID)
    const record = this.#record(parentID, "generating")
    record.childID = childID
    this.#children.add(childID)
  }

  complete(parentID: string, candidate: string): string | undefined {
    const record = this.#record(parentID, "generating")
    record.candidate = candidate
    if (!record.idleSeen) {
      record.stage = "ready"
      return undefined
    }
    record.stage = "updating"
    return candidate
  }

  fail(parentID: string): void {
    const record = this.#parents.get(parentID)
    if (record) record.stage = "handled"
  }

  onFirstIdle(parentID: string): string | undefined {
    const record = this.#parents.get(parentID)
    if (!record || record.idleSeen || record.stage === "handled") return undefined
    record.idleSeen = true
    if (record.stage !== "ready" || !record.candidate) return undefined
    record.stage = "updating"
    return record.candidate
  }

  finishUpdate(parentID: string): void {
    this.fail(parentID)
  }

  releaseChild(childID: string): void {
    this.#children.delete(childID)
  }

  isChild(sessionID: string): boolean {
    return this.#children.has(sessionID)
  }

  stage(parentID: string): TitleStage | undefined {
    return this.#parents.get(parentID)?.stage
  }

  #record(parentID: string, expected: TitleStage): TitleRecord {
    const record = this.#parents.get(parentID)
    if (!record || record.stage !== expected) throw new Error(`invalid title state for ${parentID}`)
    return record
  }
}
