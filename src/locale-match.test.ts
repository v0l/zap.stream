import { describe, expect, it } from "bun:test"
import { resolveMessages } from "./locale-match"

const known: Record<string, Record<string, string>> = { de: { a: "de" }, "pt-BR": { a: "br" }, pt: { a: "pt" } }
const match = async (l: string) => known[l]
const fallback = { a: "en" }

describe("resolveMessages", () => {
  it("falls back to the base language", async () => {
    expect(await resolveMessages("de-AT", match, fallback)).toEqual({ a: "de" })
  })
  it("prefers the exact locale", async () => {
    expect(await resolveMessages("pt-BR", match, fallback)).toEqual({ a: "br" })
  })
  it("falls back to default messages", async () => {
    expect(await resolveMessages("xx-YY", match, fallback)).toEqual(fallback)
  })
})
