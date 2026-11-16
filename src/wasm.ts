import {
  compress,
  default as wasmInit,
  expand_filter,
  flat_merge,
  get_diff,
  schnorr_verify_batch,
} from "@snort/system-wasm"
import WasmPath from "@snort/system-wasm/pkg/system_wasm_bg.wasm?url"
import {
  DefaultOptimizer,
  EventExt,
  type FlatReqFilter,
  type NostrEvent,
  type Optimizer,
  type ReqFilter,
} from "@snort/system"

function batchVerify(events: Array<NostrEvent>): Array<boolean> {
  const results = events.map(() => false)
  const pending: Array<number> = []
  events.forEach((ev, i) => {
    try {
      if (EventExt.createId(ev) !== ev.id) return
      if (EventExt.isVerified(ev)) {
        results[i] = true
        return
      }
      pending.push(i)
    } catch {
      results[i] = false
    }
  })
  if (pending.length === 0) return results

  let verdicts: Uint8Array
  try {
    verdicts = schnorr_verify_batch(pending.map(i => events[i]))
  } catch {
    pending.forEach(i => {
      results[i] = EventExt.verify(events[i])
    })
    return results
  }
  pending.forEach((eventIndex, n) => {
    if (verdicts[n] === 1) {
      results[eventIndex] = true
      EventExt.markVerified(events[eventIndex])
    }
  })
  return results
}

export const WasmOptimizer: Optimizer = {
  ...DefaultOptimizer,
  expandFilter: (f: ReqFilter) => {
    return expand_filter(f) as Array<FlatReqFilter>
  },
  getDiff: (prev: Array<ReqFilter>, next: Array<ReqFilter>) => {
    return get_diff(prev, next) as Array<FlatReqFilter>
  },
  flatMerge: (all: Array<FlatReqFilter>) => {
    return flat_merge(all) as Array<ReqFilter>
  },
  compress: (all: Array<ReqFilter>) => {
    return compress(all as unknown as Array<FlatReqFilter>) as Array<ReqFilter>
  },
  schnorrVerify: ev => batchVerify([ev])[0],
  batchVerify,
}

export { wasmInit, WasmPath }
