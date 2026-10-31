import "./alert.css"

import { EventBuilder, NostrSystem } from "@snort/system"
import { SnortContext } from "@snort/system-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { IntlProvider } from "react-intl"

import { defaultRelays } from "@/const"
import enMessages from "@/translations/en.json"
import { AlertWidget } from "./widget"

EventBuilder.ClientTag = ["client", "zap.stream", __ZAP_STREAM_VERSION__]

const system = new NostrSystem({ buildFollowGraph: false, disableSyncModule: true })
for (const [relay, settings] of Object.entries(defaultRelays)) {
  system.ConnectToRelay(relay, settings)
}
void system.Init()

createRoot(document.getElementById("alert") as HTMLDivElement).render(
  <StrictMode>
    <SnortContext value={system}>
      <IntlProvider locale="en-US" messages={enMessages}>
        <AlertWidget />
      </IntlProvider>
    </SnortContext>
  </StrictMode>,
)
