import { expect, test } from "bun:test"
import { renderToString } from "react-dom/server"
import { Emoji } from "./emoji"

test("Emoji renders https urls and drops unsafe schemes", () => {
  const html = renderToString(<Emoji name="ok" url="https://example.com/e.png" />)
  expect(html).toContain("https://example.com/e.png")

  for (const url of ["http://192.168.1.1/pixel.png", "javascript:alert(1)", "data:image/png;base64,AAAA", ""]) {
    expect(renderToString(<Emoji name="no" url={url} />)).not.toContain("<img")
  }
})
