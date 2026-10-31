import { type ReactNode, useMemo, useState } from "react"
import { FormattedMessage } from "react-intl"
import { NostrLink } from "@snort/system"
import { NostrPrefix, hexToBech32 } from "@snort/shared"

import { CopyField } from "@/element/copy-field"
import { ConnectLegacyStream } from "@/element/legacy"
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed"
import { useLogin } from "@/hooks/login"
import { ChatApis } from "@/service/chat/types"
import { toTextToSpeechParams } from "@/text2speech"
import { DashboardCard } from "./dashboard/card"
import { Music } from "./widgets/music"
import { TopZappersWidget } from "./widgets/top-zappers"
import { type TtsSettings, TtsSettingsForm } from "./widgets/tts-settings"
import { Views } from "./widgets/views"
import { ZapAlertItem } from "./widgets/zaps"

function WidgetPreview({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-28 rounded-xl border border-dashed border-layer-3 bg-layer-0 p-4 overflow-hidden">
      {children ?? (
        <span className="text-sm text-layer-4">
          <FormattedMessage defaultMessage="Shows here while you are live" />
        </span>
      )}
    </div>
  )
}

function ZapAlertCard({ npub, baseUrl, pubkey }: { npub: string; baseUrl: string; pubkey?: string }) {
  const [testText, setTestText] = useState("")
  const [tts, setTts] = useState<TtsSettings>({ voice: null, minSats: "21", volume: 1 })

  const query = useMemo(() => {
    const params = toTextToSpeechParams({
      voiceURI: tts.voice,
      minSats: tts.voice ? Number(tts.minSats) : null,
      volume: tts.volume,
    }).toString()
    return params.length > 0 ? `?${params}` : ""
  }, [tts])

  return (
    <DashboardCard title={<FormattedMessage defaultMessage="Zap alert" />}>
      <p className="text-sm text-layer-5">
        <FormattedMessage defaultMessage="Pops up for 10 seconds each time someone zaps your stream." />
      </p>
      <CopyField value={`${baseUrl}/alert/${npub}/zaps${query}`} showEnd={true} />
      <WidgetPreview>
        <ZapAlertItem
          item={{
            id: "",
            valid: true,
            content: testText,
            zapService: "",
            anonZap: false,
            errors: [],
            sender: pubkey,
            amount: 21_000,
            targetEvents: [],
            created_at: 0,
          }}
        />
      </WidgetPreview>
      <div className="flex flex-col gap-3 pt-4 border-t border-layer-3">
        <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-layer-4">
          <FormattedMessage defaultMessage="Text to speech" />
        </h3>
        <TtsSettingsForm value={tts} onChange={setTts} testText={testText} setTestText={setTestText} />
      </div>
    </DashboardCard>
  )
}

function ChatWidgetCard({ npub, baseUrl }: { npub: string; baseUrl: string }) {
  const [badges, setBadges] = useState(true)
  const chatParams = new URLSearchParams()
  chatParams.set("badges", String(badges))
  for (const [k, v] of Object.entries(ChatApis)) {
    const params = v.getWidgetParams()
    if (params) {
      chatParams.set(k, params)
    }
  }
  return (
    <DashboardCard title={<FormattedMessage defaultMessage="Chat" />}>
      <p className="text-sm text-layer-5">
        <FormattedMessage defaultMessage="Your zap.stream chat, merged with any accounts you link below." />
      </p>
      <CopyField value={`${baseUrl}/chat/${npub}#${chatParams}`} secret={true} />
      <p className="text-sm text-warning">
        <FormattedMessage defaultMessage="Keep this link private. It holds the login tokens of your linked accounts." />
      </p>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          className="accent-primary w-4 h-4"
          checked={badges}
          onChange={e => setBadges(e.target.checked)}
        />
        <FormattedMessage defaultMessage="Show badges" />
      </label>
      <div className="flex flex-col gap-3 pt-4 border-t border-layer-3">
        <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-layer-4">
          <FormattedMessage defaultMessage="Linked accounts" />
        </h3>
        <ConnectLegacyStream />
      </div>
    </DashboardCard>
  )
}

function OverlayWidgetCard({
  title,
  description,
  url,
  children,
}: {
  title: ReactNode
  description: ReactNode
  url: string
  children?: ReactNode
}) {
  return (
    <DashboardCard title={title}>
      <p className="text-sm text-layer-5">{description}</p>
      <CopyField value={url} showEnd={true} />
      <WidgetPreview>{children}</WidgetPreview>
    </DashboardCard>
  )
}

export function WidgetsPage() {
  const login = useLogin()
  const profileLink = new NostrLink(NostrPrefix.PublicKey, login?.pubkey ?? "")
  const current = useCurrentStreamFeed(profileLink)
  const currentLink = current ? NostrLink.fromEvent(current) : undefined
  const npub = hexToBech32("npub", login?.pubkey)
  const baseUrl = `${window.location.protocol}//${window.location.host}`

  if (!login?.pubkey) {
    return (
      <div className="p-4 sm:p-6">
        <h2>
          <FormattedMessage defaultMessage="Please login first." />
        </h2>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 min-w-0 max-w-[1560px]">
      <header className="flex flex-col gap-1">
        <h1 className="text-[clamp(24px,2.6vw,34px)] leading-tight">
          <FormattedMessage defaultMessage="Stream widgets" />
        </h1>
        <p className="text-layer-4">
          <FormattedMessage defaultMessage="Add these to OBS as a Browser Source. Each one follows whichever stream you are live on." />
        </p>
      </header>
      <div className="grid gap-5 lg:grid-cols-2 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          <ZapAlertCard npub={npub} baseUrl={baseUrl} pubkey={login.pubkey} />
          <OverlayWidgetCard
            title={<FormattedMessage defaultMessage="Viewer count" />}
            description={<FormattedMessage defaultMessage="How many people are watching right now." />}
            url={`${baseUrl}/alert/${npub}/views`}
          >
            {currentLink && <Views link={currentLink} />}
          </OverlayWidgetCard>
          <OverlayWidgetCard
            title={<FormattedMessage defaultMessage="Now playing" />}
            description={
              <FormattedMessage defaultMessage="The track from your music status, for music apps that publish one." />
            }
            url={`${baseUrl}/alert/${npub}/music`}
          >
            {currentLink && <Music link={currentLink} />}
          </OverlayWidgetCard>
        </div>
        <div className="flex flex-col gap-5 min-w-0">
          <ChatWidgetCard npub={npub} baseUrl={baseUrl} />
          <OverlayWidgetCard
            title={<FormattedMessage defaultMessage="Top zappers" />}
            description={<FormattedMessage defaultMessage="The three biggest zappers on your current stream." />}
            url={`${baseUrl}/alert/${npub}/top-zappers`}
          >
            {currentLink && <TopZappersWidget link={currentLink} />}
          </OverlayWidgetCard>
        </div>
      </div>
    </div>
  )
}
