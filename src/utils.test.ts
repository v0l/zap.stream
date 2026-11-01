import { describe, expect, test } from "bun:test"
import { safeMediaUrl } from "./utils"

describe("safeMediaUrl", () => {
  test("allows plain https URLs", () => {
    expect(safeMediaUrl("https://example.com/pic.png")).toBe("https://example.com/pic.png")
  })
  test("rejects http (intranet probe), data:, custom schemes and non-URLs", () => {
    expect(safeMediaUrl("http://192.168.1.1/x.png")).toBeUndefined()
    expect(safeMediaUrl("data:image/png;base64,AAAA")).toBeUndefined()
    expect(safeMediaUrl("javascript:alert(1)")).toBeUndefined()
    expect(safeMediaUrl("blob:https://zap.stream/x")).toBeUndefined()
    expect(safeMediaUrl("not a url")).toBeUndefined()
    expect(safeMediaUrl(undefined)).toBeUndefined()
    expect(safeMediaUrl("")).toBeUndefined()
  })
})
