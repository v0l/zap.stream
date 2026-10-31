import "@/test/dom"
import { expect, test } from "bun:test"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { useVoices } from "./text2speech"

let seen = 0
function Probe() {
  seen = useVoices().length
  return null
}

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

test("voices that load after mount are picked up", () => {
  const synth = new EventTarget() as EventTarget & { getVoices: () => Array<{ name: string }> }
  let loaded: Array<{ name: string }> = []
  synth.getVoices = () => loaded
  ;(window as unknown as { speechSynthesis: unknown }).speechSynthesis = synth
  ;(globalThis as unknown as { speechSynthesis: unknown }).speechSynthesis = synth

  const root = createRoot(document.createElement("div"))
  act(() => root.render(<Probe />))
  expect(seen).toBe(0)
  loaded = [{ name: "Daniel" }]
  act(() => {
    synth.dispatchEvent(new Event("voiceschanged"))
  })
  expect(seen).toBe(1)
  act(() => root.unmount())
})
