import { useContext } from "react"
import { NostrLink } from "@snort/system"
import { SnortContext } from "@snort/system-react"
import { FormattedMessage } from "react-intl"

import { useLogin } from "@/hooks/login"
import { DefaultButton } from "./buttons"
import { Icon } from "./icon"
import { NostrPrefix } from "@snort/shared"
import { publishFollowChange } from "@/service/contacts"

export function LoggedInFollowButton({ link, hideWhenFollowing }: { link: NostrLink; hideWhenFollowing?: boolean }) {
  const login = useLogin()
  const system = useContext(SnortContext)
  if (!login?.state) return

  const follows = login.state.follows ?? []
  const isFollowing = follows.includes(link.id)

  async function change(follow: boolean) {
    const signer = login?.signer()
    if (!login || !signer) return
    if (follow) {
      login.state?.follow(link)
    } else {
      login.state?.unfollow(link)
    }
    await publishFollowChange({
      system,
      signer,
      pubkey: login.pubkey,
      target: link.id,
      follow,
      fallbackFollows: login.state?.follows,
    })
  }

  const unfollow = () => change(false)
  const follow = () => change(true)

  if (isFollowing && hideWhenFollowing) return
  return (
    <DefaultButton onClick={isFollowing ? unfollow : follow}>
      {isFollowing ? (
        <FormattedMessage defaultMessage="Unfollow" />
      ) : (
        <>
          <Icon name="plus" size={20} />
          <FormattedMessage defaultMessage="Follow" />
        </>
      )}
    </DefaultButton>
  )
}

export function FollowButton({ pubkey, hideWhenFollowing }: { pubkey: string; hideWhenFollowing?: boolean }) {
  const login = useLogin()
  const link = new NostrLink(NostrPrefix.PublicKey, pubkey)
  return login?.pubkey ? <LoggedInFollowButton link={link} hideWhenFollowing={hideWhenFollowing} /> : null
}
