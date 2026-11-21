import { expect, test } from "bun:test"
import { renderToString } from "react-dom/server"
import { HelmetProvider, type HelmetServerState } from "@dr.pogodin/react-helmet"
import { DeleteAccountPage } from "./delete-account"
import { PrivacyPage } from "./privacy"
import { TosPage } from "./tos"

function ssr(el: React.ReactElement) {
  let helmet: HelmetServerState | undefined
  const html = renderToString(
    <HelmetProvider
      onServerState={s => {
        helmet = s
      }}
    >
      {el}
    </HelmetProvider>,
  )
  return { html, title: helmet?.title.toString() ?? "", meta: helmet?.meta.toString() ?? "" }
}

test.each([
  ["privacy", <PrivacyPage />, "Privacy Policy - zap.stream"],
  ["delete-account", <DeleteAccountPage />, "Delete your account - zap.stream"],
  ["tos", <TosPage />, "Terms of Service - zap.stream"],
])("%s renders its own title and description", (_name, el, title) => {
  const r = ssr(el)
  expect(r.title).toContain(title)
  expect(r.meta).toContain('name="description"')
  expect(r.html.length).toBeGreaterThan(500)
})
