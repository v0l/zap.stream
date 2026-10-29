import { setServerLocation } from "./globals"
import { renderToString } from "react-dom/server"
import { StaticRouter } from "react-router"
import { useRoutes } from "react-router"
import { HelmetProvider, type HelmetServerState } from "@dr.pogodin/react-helmet"
import { SnortContext } from "@snort/system-react"
import { IntlProvider as ReactIntlProvider } from "react-intl"
import { LayoutContextProvider } from "@/pages/layout/context"
import { makeRoutes } from "@/routes"
import enMessages from "@/translations/en.json"
import { ServerSystem } from "./system"
import { setStatus, takeStatus } from "./state"

const system = new ServerSystem()
const routes = makeRoutes(async () => null)
const messages = enMessages as Record<string, string>

function Routed() {
  return useRoutes(routes)
}

function render(input: { url: string; now: number; origin: string }) {
  setServerLocation(input.url, input.origin)
  system.reset()
  setStatus(200)
  let helmet: HelmetServerState | undefined
  const html = renderToString(
    <HelmetProvider
      onServerState={s => {
        helmet = s
      }}
    >
      <SnortContext value={system as never}>
        <ReactIntlProvider locale="en" defaultLocale="en" messages={messages}>
          <LayoutContextProvider>
            <StaticRouter location={input.url}>
              <Routed />
            </StaticRouter>
          </LayoutContextProvider>
        </ReactIntlProvider>
      </SnortContext>
    </HelmetProvider>,
  )
  const raw = helmet
    ? ["title", "meta", "link", "script"]
        .map(k => helmet?.[k as "title"]?.toString() ?? "")
        .filter(Boolean)
        .join("\n    ")
    : ""
  return {
    html,
    status: takeStatus(),
    head: raw ? { raw } : {},
    data: { now: input.now, origin: input.origin, ...system.data() },
  }
}

;(globalThis as { ssrRender?: (json: string) => string }).ssrRender = json => JSON.stringify(render(JSON.parse(json)))
