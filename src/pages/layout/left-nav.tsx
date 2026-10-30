import { useLayout } from "./context"
import { NavLinkIcon } from "./nav-icon"
import { FormattedMessage } from "react-intl"
import { useMediaQuery } from "usehooks-ts"
import Flyout from "@/element/flyout"
import { useFollows, useLogin } from "@/hooks/login"
import { useStreamsFeed } from "@/hooks/live-streams"
import { useSortedStreams } from "@/hooks/useLiveStreams"
import { getHost } from "@/utils"
import { useUserProfile } from "@snort/system-react"
import { Link } from "react-router"
import { Avatar } from "@/element/avatar"
import { getName } from "@/element/profile"
import type { NostrEvent } from "@snort/system"
import { useStreamHref } from "@/hooks/short-link"

export function LeftNav() {
  const layout = useLayout()
  const isDesktop = useMediaQuery("(min-width: 1280px)", { initializeWithValue: false })

  function hideAfterMobileNav() {
    if (isDesktop) return
    layout.update(c => {
      c.leftNavExpand = false
      return { ...c }
    })
  }

  if (layout.leftNav === false) return
  function navInner() {
    return (
      <div className="flex flex-col gap-7">
        <nav className="flex flex-col gap-0.5">
          <NavLinkIcon name="signal" route="/streams" onClick={hideAfterMobileNav}>
            <FormattedMessage defaultMessage="Streams" />
          </NavLinkIcon>
          <NavLinkIcon name="play-circle" route="/videos" onClick={hideAfterMobileNav}>
            <FormattedMessage defaultMessage="Videos" />
          </NavLinkIcon>
          <NavLinkIcon name="film" route="/shorts" onClick={hideAfterMobileNav}>
            <FormattedMessage defaultMessage="Shorts" />
          </NavLinkIcon>
          <NavLinkIcon name="grid" route="/category" onClick={hideAfterMobileNav}>
            <FormattedMessage defaultMessage="Categories" />
          </NavLinkIcon>
        </nav>
        <FollowingLive onNavigate={hideAfterMobileNav} />
      </div>
    )
  }

  if (isDesktop) {
    return (
      <aside className="w-[208px] shrink-0 border-r border-layer-3 px-3 py-5 sticky top-[var(--header-height)] self-start h-[calc(100dvh-var(--header-height))] overflow-y-auto">
        {navInner()}
      </aside>
    )
  }
  return (
    <Flyout
      side="left"
      show={layout.leftNavExpand}
      onClose={() => {
        layout.update(c => {
          c.leftNavExpand = !c.leftNavExpand
          return { ...c }
        })
      }}
    >
      {navInner()}
    </Flyout>
  )
}

function FollowingLive({ onNavigate }: { onNavigate: () => void }) {
  const login = useLogin()
  const follows = useFollows()
  const streams = useStreamsFeed()
  const { live } = useSortedStreams(streams)
  const following = live.filter(a => follows.has(getHost(a)))

  if (!login || following.length === 0) return
  return (
    <section className="flex flex-col gap-0.5">
      <h2 className="font-sans text-sm font-semibold text-layer-4 px-2.5 pb-1.5 tracking-normal">
        <FormattedMessage defaultMessage="Following" id="cPIKU2" />
      </h2>
      {following.slice(0, 10).map(a => (
        <FollowingRow key={a.id} ev={a} onNavigate={onNavigate} />
      ))}
    </section>
  )
}

function FollowingRow({ ev, onNavigate }: { ev: NostrEvent; onNavigate: () => void }) {
  const host = getHost(ev)
  const profile = useUserProfile(host)
  const href = useStreamHref(ev, host)
  return (
    <Link
      to={href}
      state={ev}
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-layer-2"
      title={getName(host, profile)}
    >
      <Avatar pubkey={host} user={profile} size={28} />
      <span className="flex-1 truncate text-[15px]">{getName(host, profile)}</span>
      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
    </Link>
  )
}
