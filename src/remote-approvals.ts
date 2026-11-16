import { ExternalStore } from "@snort/shared"

interface Approval {
  id: number
  owner: symbol
  url: string
  cancel: () => void
}

class RemoteApprovalStore extends ExternalStore<readonly Approval[]> {
  #pending: Approval[] = []
  #serial = 0

  show(owner: symbol, input: string, cancel: () => void): string | undefined {
    try {
      const url = new URL(input)
      if (url.protocol !== "https:" || url.username || url.password) return
      if (!this.#pending.some(p => p.owner === owner && p.url === url.href)) {
        this.#pending.push({ id: ++this.#serial, owner, url: url.href, cancel })
        this.notifyChange()
      }
      return url.href
    } catch {
      return
    }
  }

  clear(owner: symbol) {
    const pending = this.#pending.filter(p => p.owner !== owner)
    if (pending.length === this.#pending.length) return
    this.#pending = pending
    this.notifyChange()
  }

  takeSnapshot() {
    return [...this.#pending]
  }
}

export const RemoteApprovals = new RemoteApprovalStore()
