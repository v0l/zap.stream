import { expect, test } from "bun:test"
import { PrivateKeySigner } from "@snort/system"
import { hexToBech32 } from "@snort/shared"
import { defaultLightningAddress, lightningAddressCheckRequired, parsePrivateKey } from "./login-keys"

const signer = new PrivateKeySigner("1d6d1d6c1d1f4f1e8a6b0a1c9e2f3d4c5b6a79881726354433221100ffeeddcc")

test("new account lightning address uses the account pubkey", () => {
  expect(defaultLightningAddress(signer.privateKey, "zap.stream")).toBe(`${signer.getPubKey()}@zap.stream`)
})

test("private key accepts nsec and hex", () => {
  expect(parsePrivateKey(hexToBech32("nsec", signer.privateKey))).toBe(signer.privateKey)
  expect(parsePrivateKey(` ${signer.privateKey} `)).toBe(signer.privateKey)
})

test("private key rejects junk", () => {
  expect(() => parsePrivateKey("hello")).toThrow()
  expect(() => parsePrivateKey(hexToBech32("npub", signer.getPubKey()))).toThrow()
})

test("lightning address is checked in production", () => {
  expect(lightningAddressCheckRequired("bad@example.com", false)).toBe(true)
  expect(lightningAddressCheckRequired("bad@example.com", true)).toBe(true)
  expect(lightningAddressCheckRequired("abc@localhost:5173", true)).toBe(false)
})
