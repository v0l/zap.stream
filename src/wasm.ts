import {
  compress,
  default as wasmInit,
  expand_filter,
  flat_merge,
  get_diff,
  schnorr_verify_event,
} from "@snort/system-wasm"
import WasmPath from "@snort/system-wasm/pkg/system_wasm_bg.wasm?url"
import { DefaultOptimizer, type ReqFilter, type FlatReqFilter, type Optimizer } from "@snort/system"

// Signature verification comes from DefaultOptimizer (per-event JS schnorr with
// an EventExt verified-flag fast path). The wasm build exposes
// schnorr_verify_batch, but its contract (input shape / result semantics) is
// undocumented; before switching verification to it, add a test that proves it
// rejects a tampered event.
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
  schnorrVerify: ev => {
    return schnorr_verify_event(ev)
  },
}

export { wasmInit, WasmPath }
