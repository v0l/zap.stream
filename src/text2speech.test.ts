import { expect, test } from "bun:test"
import { pickVoice } from "./text2speech"

const voice = (voiceURI: string, name: string, isDefault = false) => ({
  voiceURI,
  name,
  lang: "en-US",
  default: isDefault,
})

test("a voice picked in another browser still speaks in OBS", () => {
  const obs = [voice("Microsoft David - English (United States)", "Microsoft David", true), voice("Zira", "Zira")]
  expect(pickVoice(obs, "Microsoft Mark - English (United States)")?.name).toBe("Microsoft David")
})

test("the exact voice wins when it exists", () => {
  const voices = [voice("a", "A", true), voice("b", "B")]
  expect(pickVoice(voices, "b")?.name).toBe("B")
})

test("no voice configured means no speech", () => {
  expect(pickVoice([voice("a", "A", true)], null)).toBeUndefined()
})
