import { DefaultButton } from "./buttons"
import { FormattedMessage, useIntl } from "react-intl"
import { ChatApis } from "@/service/chat/types"
import { useEffect, useState } from "react"
import { unixNow } from "@snort/shared"

export function ConnectLegacyStream() {
  const [_, setTick] = useState(0)
  const callbackUrl = new URL(window.location.href)

  useEffect(() => {
    const hash = window.location.hash
    const auth_flow = new URL(window.location.href).searchParams.get("auth_flow")
    if (hash !== "" && auth_flow && Object.hasOwn(ChatApis, auth_flow)) {
      const provider = ChatApis[auth_flow as "twitch" | "youtube" | "kick"]
      provider.handleAuthCallback(`${hash.substring(1)}&created=${unixNow()}`)
      window.location.hash = ""
      setTick(v => v + 1)
    }
  }, [])

  callbackUrl.hash = ""
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(ChatApis).map(([k, v]) => {
        if (v.isAuthed()) {
          const expired = (v.expireTime() ?? Number.POSITIVE_INFINITY) < unixNow()
          return (
            <div key={k} className="flex items-center justify-between gap-3 rounded-xl border border-layer-3 px-3 py-2">
              <span className="flex items-center gap-2 min-w-0">
                <span className={expired ? "w-2 h-2 rounded-full bg-warning" : "w-2 h-2 rounded-full bg-success"} />
                <span className="font-semibold">{v.name}</span>
                <span className={expired ? "text-sm text-warning" : "text-sm text-layer-4"}>
                  {expired ? (
                    <FormattedMessage defaultMessage="Expired" />
                  ) : (
                    <FormattedMessage defaultMessage="Connected" />
                  )}
                </span>
              </span>
              <DefaultButton
                onClick={() => {
                  v.disconnect()
                  setTick(v => v + 1)
                }}
              >
                <FormattedMessage defaultMessage="Disconnect" />
              </DefaultButton>
            </div>
          )
        }
        if (v.authType === "oauth") {
          return (
            <DefaultButton
              key={k}
              className="w-full !py-2.5"
              onClick={() => {
                callbackUrl.searchParams.set("auth_flow", k)
                const url = v.getAuthUrl(callbackUrl.toString())
                window.location.href = url
              }}
            >
              <FormattedMessage defaultMessage="Connect {provider}" values={{ provider: v.name }} />
            </DefaultButton>
          )
        } else {
          // no auth just means we can directly load the stream chat without a token and only
          // require the channel name
          return (
            <InputChannelName
              key={k}
              platformName={v.name}
              onSave={c => {
                v.handleAuthCallback(c)
                setTick(v => v + 1)
              }}
            />
          )
        }
      })}
    </div>
  )
}

function InputChannelName({ platformName, onSave }: { platformName: string; onSave: (s: string) => void }) {
  const { formatMessage } = useIntl()
  const [value, setValue] = useState("")
  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={formatMessage({ defaultMessage: "{platform} channel name" }, { platform: platformName })}
      />
      <DefaultButton
        className="shrink-0"
        disabled={value.trim().length === 0}
        onClick={() => onSave(`channel=${value.trim()}`)}
      >
        <FormattedMessage defaultMessage="Connect" />
      </DefaultButton>
    </div>
  )
}
