import { useStreamLinkFor } from "@/hooks/stream-link-core"
import { Music } from "@/pages/widgets/music"
import { TopZappersWidget } from "@/pages/widgets/top-zappers"
import { Views } from "@/pages/widgets/views"
import { ZapAlerts } from "@/pages/widgets/zaps"
import { parseAlertPath } from "./route"

export function AlertWidget() {
  const alert = parseAlertPath(window.location.pathname)
  const { link } = useStreamLinkFor(alert?.id)
  if (!alert || !link) return

  switch (alert.type) {
    case "zaps":
      return <ZapAlerts link={link} />
    case "views":
      return <Views link={link} />
    case "top-zappers":
      return <TopZappersWidget link={link} />
    case "music":
      return <Music link={link} />
  }
}
