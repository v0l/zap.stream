import "@/test/dom"
import { expect, mock, test } from "bun:test"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter, Route, Routes } from "react-router"

mock.module("@/hooks/stream-link", () => ({
  useStreamLink: () => undefined,
  useStreamLinkState: () => ({ link: undefined, notFound: true }),
}))
function NotFoundStub() {
  return "Nothing here"
}
mock.module("./catch-all", () => ({ CatchAllRoutePage: NotFoundStub }))

const { LinkHandler } = await import("./link-handler")

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

test("an unknown name shows the not found page instead of a blank page", async () => {
  const el = document.createElement("div")
  const root = createRoot(el)
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={["/nothere"]}>
        <Routes>
          <Route path="/:id" element={<LinkHandler />} />
        </Routes>
      </MemoryRouter>,
    ),
  )
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })
  expect(el.textContent).toContain("Nothing here")
  act(() => root.unmount())
})
