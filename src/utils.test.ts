import { expect, test } from "bun:test"
import { safeProviderUrl } from "./utils"

test("safeProviderUrl keeps https provider urls", () => {
  expect(safeProviderUrl("https://streamstr.net/api/v1")).toBe("https://streamstr.net/api/v1")
})

test("safeProviderUrl drops non https or malformed provider urls", () => {
  for (const url of ["http://10.0.0.1/api/v1", "javascript:alert(1)", "streamstr.net", "", undefined]) {
    expect(safeProviderUrl(url)).toBeUndefined()
  }
})
