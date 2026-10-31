import { expect, test } from "bun:test"
import { renderToString } from "react-dom/server"
import { HydratedOnly } from "./hydrated-only"

test("client only content is not server rendered, so a featured preview cannot autoplay with sound before hydration", () => {
  const html = renderToString(
    <HydratedOnly>
      <video autoPlay muted src="https://example.com/live.m3u8" />
    </HydratedOnly>,
  )
  expect(html).not.toContain("video")
})
