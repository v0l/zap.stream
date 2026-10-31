import "@/test/dom"
import { expect, test } from "bun:test"
import { act, useState } from "react"
import { createRoot } from "react-dom/client"
import { LayoutContextProvider, useHideHeader, useLayout } from "./context"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function StreamPage() {
  useHideHeader(true)
  return null
}

let showHeader: boolean | undefined
let leaveStream: () => void = () => {}

function App() {
  const [onStream, setOnStream] = useState(true)
  leaveStream = () => setOnStream(false)
  showHeader = useLayout().showHeader
  return onStream ? <StreamPage /> : null
}

test("header comes back after leaving a page that hid it", () => {
  const root = createRoot(document.createElement("div"))
  act(() =>
    root.render(
      <LayoutContextProvider>
        <App />
      </LayoutContextProvider>,
    ),
  )
  expect(showHeader).toBe(false)
  act(() => leaveStream())
  expect(showHeader).toBe(true)
  act(() => root.unmount())
})
