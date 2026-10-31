import { bech32ToHex, getPublicKey, isHex } from "@snort/shared"

export function parsePrivateKey(input: string) {
  const trimmed = input.trim()
  const hex = trimmed.startsWith("nsec1") ? bech32ToHex(trimmed) : trimmed
  if (hex.length !== 64 || !isHex(hex)) {
    throw new Error("Invalid private key")
  }
  return hex
}

export function defaultLightningAddress(privateKey: string, host: string) {
  return `${getPublicKey(privateKey)}@${host}`
}

export function lightningAddressCheckRequired(address: string, dev: boolean) {
  return !(dev && address.includes("localhost"))
}
