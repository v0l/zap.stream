import { useLogin } from "@/hooks/login"
import { NostrStreamProvider, adaptPublisher } from "@/providers"
import { base64 } from "@scure/base"
import { unwrap } from "@snort/shared"
import { useEffect, useState } from "react"
import { safeProviderUrl } from "@/utils"
import { Icon } from "../icon"
import { DefaultButton } from "../buttons"
import { useIntl } from "react-intl"

export function NotificationsButton({ host, service }: { host: string; service: string }) {
  const login = useLogin()
  const { formatMessage } = useIntl()
  const publisher = login?.publisher()
  const [subscribed, setSubscribed] = useState(false)
  const svcUrl = safeProviderUrl(service)
  const api = svcUrl ? new NostrStreamProvider("", svcUrl, publisher ? adaptPublisher(publisher) : undefined) : undefined

  async function isSubscribed() {
    if (!api) return
    const reg = await navigator.serviceWorker.ready
    if (reg) {
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const auth = base64.encode(new Uint8Array(unwrap(sub.getKey("auth"))))
        const subs = await api.listStreamerSubscriptions(auth)
        setSubscribed(subs.includes(host))
      }
    }
  }

  async function enableNotifications() {
    // request permissions to send notifications
    if ("Notification" in window) {
      try {
        if (Notification.permission !== "granted") {
          const res = await Notification.requestPermission()
          console.debug(res)
        }
        return Notification.permission === "granted"
      } catch (e) {
        console.error(e)
      }
    }
    return false
  }

  async function subscribe() {
    if (!api) return
    if (await enableNotifications()) {
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready
          if (reg && publisher) {
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: (await api.getNotificationsInfo()).publicKey,
            })
            await api.subscribeNotifications({
              endpoint: sub.endpoint,
              key: base64.encode(new Uint8Array(unwrap(sub.getKey("p256dh")))),
              auth: base64.encode(new Uint8Array(unwrap(sub.getKey("auth")))),
              scope: `${location.protocol}//${location.hostname}`,
            })
            await api.addStreamerSubscription(host)
            setSubscribed(true)
          }
        } else {
          console.warn("No service worker")
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  async function unsubscribe() {
    if (publisher && api) {
      await api.removeStreamerSubscription(host)
      setSubscribed(false)
    }
  }

  useEffect(() => {
    isSubscribed().catch(console.error)
  }, [])

  // Hide the bell when the stream's service URL is not a safe https URL —
  // every button action would send signed auth events to that host.
  if (!api) return null

  return (
    <DefaultButton
      onClick={subscribed ? unsubscribe : subscribe}
      aria-pressed={subscribed}
      aria-label={formatMessage({ defaultMessage: "Stream notifications" })}
    >
      <Icon name={subscribed ? "bell-off" : "bell-plus"} />
    </DefaultButton>
  )
}
