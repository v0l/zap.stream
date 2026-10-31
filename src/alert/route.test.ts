import { expect, test } from "bun:test"
import { parseAlertPath } from "./route"

test("alert urls give the stream id and widget type", () => {
  expect(parseAlertPath("/alert/npub1abc/zaps")).toEqual({ id: "npub1abc", type: "zaps" })
  expect(parseAlertPath("/alert/kieran@zap.stream/top-zappers")).toEqual({
    id: "kieran@zap.stream",
    type: "top-zappers",
  })
  expect(parseAlertPath("/alert/kieran%40zap.stream/views")).toEqual({ id: "kieran@zap.stream", type: "views" })
})

test("anything else is not an alert", () => {
  expect(parseAlertPath("/alert/npub1abc/unknown")).toBeUndefined()
  expect(parseAlertPath("/alert/npub1abc")).toBeUndefined()
  expect(parseAlertPath("/chat/npub1abc")).toBeUndefined()
})
