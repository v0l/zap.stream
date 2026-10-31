import { FormattedMessage } from "react-intl"

import PlayStore from "../images/GetItOnGooglePlay_Badge_Web_color_English.png"
import AppStore from "../images/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg"
import Obtanium from "../images/badge_obtainium.png"
import QrCode from "@/element/qr-code"

const Stores = [
  {
    name: "Google Play",
    link: "https://play.google.com/store/apps/details?id=io.nostrlabs.zap_stream_flutter",
    badge: PlayStore,
  },
  { name: "App Store", link: "https://testflight.apple.com/join/5Qh7mfvU", badge: AppStore },
  { name: "Obtainium", link: "https://github.com/nostrlabs-io/zap-stream-flutter", badge: Obtanium },
]

export function DownloadAppPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:px-8 sm:py-7 max-w-[1100px]">
      <div className="flex flex-col gap-1">
        <h1 className="text-[clamp(24px,2.6vw,34px)] leading-tight">
          <FormattedMessage defaultMessage="Get the zap.stream app" />
        </h1>
        <p className="text-layer-4">
          <FormattedMessage defaultMessage="Watch and go live from your phone. Scan a code or tap a badge." />
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {Stores.map(s => (
          <div
            key={s.name}
            className="flex flex-col items-center gap-4 rounded-2xl border border-layer-3 bg-layer-1 p-5"
          >
            <div className="rounded-xl bg-white p-2">
              <QrCode data={s.link} link={s.link} />
            </div>
            <a href={s.link} target="_blank" rel="noopener">
              <img src={s.badge} width={140} alt={s.name} />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
