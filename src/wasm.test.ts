import { describe, expect, test } from "bun:test"
import { PrivateKeySigner, type NostrEvent } from "@snort/system"
import { WasmOptimizer } from "./wasm"

// The checkSigs path (connection-pool batchVerify) requires a full Optimizer.
// WasmOptimizer previously lacked batchVerify behind an `as Optimizer` cast,
// which would have made every relay event batch throw once checkSigs is on.
describe("WasmOptimizer", () => {
  test("implements the full Optimizer interface", () => {
    for (const fn of ["expandFilter", "getDiff", "flatMerge", "compress", "schnorrVerify", "batchVerify"] as const) {
      expect(typeof WasmOptimizer[fn]).toBe("function")
    }
  })

  test("batchVerify accepts valid events and rejects tampered ones", async () => {
    const signer = new PrivateKeySigner("d9e1b17c9c6f35e6b0f2a3e3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3")
    const signed = await signer.sign({
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: "batch verify test",
      pubkey: await signer.getPubKey(),
      id: "",
      sig: "",
    } as NostrEvent)
    // Fresh id so the EventExt verified-id cache doesn't short-circuit — this
    // exercises the real schnorr path for the tampered event.
    const tampered = { ...signed, id: "aa".repeat(32), content: "tampered after signing" }

    const results = WasmOptimizer.batchVerify([signed, tampered])
    expect(results.length).toBe(2)
    expect(results[0]).toBe(true)
    expect(results[1]).toBe(false)
  })

  test("verification binds the claimed id to the content and signature", async () => {
    const signer = new PrivateKeySigner("e9e1b17c9c6f35e6b0f2a3e3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3")
    const signed = await signer.sign({
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: "id binding test",
      pubkey: await signer.getPubKey(),
      id: "",
      sig: "",
    } as NostrEvent)
    // Content altered but the original (verified) claimed id kept: must fail —
    // the recomputed id no longer matches the claimed id.
    const stolenId = { ...signed, content: "different content, same claimed id" }
    // Valid signature over the content, but the claimed id is not that
    // content's id: must fail — id and content must agree.
    const relabeled = { ...signed, id: "bb".repeat(32) }

    expect(WasmOptimizer.batchVerify([stolenId])[0]).toBe(false)
    expect(WasmOptimizer.batchVerify([relabeled])[0]).toBe(false)
    expect(WasmOptimizer.schnorrVerify(stolenId)).toBe(false)
    expect(WasmOptimizer.schnorrVerify(relabeled)).toBe(false)
  })
})
