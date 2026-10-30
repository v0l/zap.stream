import { IconButton, Layer1Button } from "./buttons"
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
    <>
      {Object.entries(ChatApis).map(([k, v]) => {
        if (v.isAuthed()) {
          return (
            <div key={k} className="flex justify-between">
              <div className="flex gap-2">
                <span className="text-green-400">
                  <FormattedMessage defaultMessage="{provider} connected!" values={{ provider: v.name }} />
                </span>
                {(v.expireTime() ?? Number.POSITIVE_INFINITY) < unixNow() && (
                  <span className="text-red-400">
                    <FormattedMessage defaultMessage="Expired!" />
                  </span>
                )}
              </div>
              <IconButton
                iconName="x"
                iconSize={16}
                className="text-red-500"
                onClick={() => {
                  v.disconnect()
                  setTick(v => v + 1)
                }}
              />
            </div>
          )
        }
        if (v.authType === "oauth") {
          return (
            <Layer1Button
              key={k}
              onClick={() => {
                callbackUrl.searchParams.set("auth_flow", k)
                const url = v.getAuthUrl(callbackUrl.toString())
                window.location.href = url
              }}
            >
              <FormattedMessage defaultMessage="Login with {provider}" values={{ provider: v.name }} />
            </Layer1Button>
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
    </>
  )
}

function InputChannelName({ platformName, onSave }: { platformName: string; onSave: (s: string) => void }) {
  const { formatMessage } = useIntl()
  const [value, setValue] = useState("")
  return (
    <div className="flex gap-2 items-center">
      <input
        className="!bg-layer-1"
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={formatMessage({ defaultMessage: "{platform} channel name.." }, { platform: platformName })}
      />
      <Layer1Button onClick={() => onSave(`channel=${value}`)}>
        <FormattedMessage defaultMessage="Save" />
      </Layer1Button>
    </div>
  )
}
