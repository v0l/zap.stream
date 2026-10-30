import { expect, test } from "bun:test"
import { withQuery } from "./query"

test("withQuery encodes reserved characters", () => {
  expect(withQuery("withdraw", { invoice: "a+b/c=&d" })).toBe("withdraw?invoice=a%2Bb%2Fc%3D%26d")
})

test("withQuery joins params and keeps numbers", () => {
  expect(withQuery("history", { page: 1, pageSize: 20 })).toBe("history?page=1&pageSize=20")
})
