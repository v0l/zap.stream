import {
  compress,
  default as wasmInit,
  expand_filter,
  flat_merge,
  get_diff,
} from "@snort/system-wasm"
import WasmPath from "@snort/system-wasm/pkg/system_wasm_bg.wasm?url"
import { DefaultOptimizer, EventExt, type ReqFilter, type FlatReqFilter, type Optimizer } from "@snort/system"

// Verification uses EventExt.verify for both entry points: it enforces the
// full id/content/signature binding (recomputes the id and rejects claimed-id
// mismatches before consulting the verified cache) rather than trusting the
// claimed id. The wasm build's schnorr_verify_batch exists but its contract
// (input shape / result semantics) is undocumented; before wiring it for
// verification, add a test that proves it rejects tampered events.
// Perf: ~0.7 ms/event JS schnorr cold — re-measure on-device before
// switching large burst loads to wasm.
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
  schnorrVerify: ev => EventExt.verify(ev),
  batchVerify: evs => evs.map(ev => EventExt.verify(ev)),
}

export { wasmInit, WasmPath }
