import { describe, expect, test } from "bun:test"
import { safeMediaUrl, safeProviderUrl } from "./utils"

test("safeProviderUrl keeps https provider urls", () => {
  expect(safeProviderUrl("https://streamstr.net/api/v1")).toBe("https://streamstr.net/api/v1")
})

test("safeProviderUrl drops non https or malformed provider urls", () => {
  for (const url of ["http://10.0.0.1/api/v1", "javascript:alert(1)", "streamstr.net", "", undefined]) {
    expect(safeProviderUrl(url)).toBeUndefined()
  }
})

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
