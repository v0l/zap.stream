import {
  compress,
  default as wasmInit,
  expand_filter,
  flat_merge,
  get_diff,
  schnorr_verify_event,
} from "@snort/system-wasm";
import WasmPath from "@snort/system-wasm/pkg/system_wasm_bg.wasm";
import type { ReqFilter, FlatReqFilter, Optimizer } from "@snort/system";

export const WasmOptimizer = {
  expandFilter: (f: ReqFilter) => {
    return expand_filter(f) as Array<FlatReqFilter>;
  },
  getDiff: (prev: Array<ReqFilter>, next: Array<ReqFilter>) => {
    return get_diff(prev, next) as Array<FlatReqFilter>;
  },
  flatMerge: (all: Array<FlatReqFilter>) => {
    return flat_merge(all) as Array<ReqFilter>;
  },
  compress: (all: Array<ReqFilter>) => {
    return compress(all) as Array<ReqFilter>;
  },
  schnorrVerify: ev => {
    return schnorr_verify_event(ev);
  },
} as Optimizer;

export { wasmInit, WasmPath };
