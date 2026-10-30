import { BorderButton, IconButton, PrimaryButton } from "@/element/buttons"
import { Icon } from "@/element/icon"
import { LoginSignup } from "@/element/login-signup"
import Logo from "@/element/logo"
import Modal from "@/element/modal"
import { AllLocales } from "@/intl"
import { Login } from "@/login"
import { profileLink } from "@/utils"
import { Menu, MenuItem, MenuDivider } from "@szhsin/react-menu"
import { FormattedMessage, useIntl } from "react-intl"
import { Link, useNavigate } from "react-router"
import { useLang } from "@/hooks/lang"
import { useLogin } from "@/hooks/login"
import { useState } from "react"
import { Profile } from "@/element/profile"
import { SearchBar } from "./search"
import { NavLinkIcon } from "./nav-icon"
import { useLayout } from "./context"
import { WHITELIST } from "@/const"

export function HeaderNav() {
  const navigate = useNavigate()
  const login = useLogin()
  const { formatMessage } = useIntl()
  const [showLogin, setShowLogin] = useState(false)
  const { lang, setLang } = useLang()
  const country = lang.split(/[-_]/i)[1]?.toLowerCase()
  const layoutState = useLayout()

  function langSelector() {
    return (
      <Menu
        menuClassName="ctx-menu"
        menuButton={
          <div className="flex gap-2 items-center">
            {country && <div className={`fi fi-${country}`}></div>}
            <div className="uppercase pointer">
              <b>{lang.includes("-") ? lang.split("-")[0] : lang}</b>
            </div>
          </div>
        }
        align="end"
        gap={5}
      >
        {[...AllLocales].sort().map(l => (
          <MenuItem className="capitalize" onClick={() => setLang(l)} key={l}>
            {new Intl.DisplayNames([l], {
              type: "language",
            }).of(l)}
          </MenuItem>
        ))}
      </Menu>
    )
  }

  function loggedIn() {
    if (!login) return

    return (
      <div className="flex gap-2 items-center">
        {(!WHITELIST || WHITELIST.includes(login.pubkey)) && (
          <>
            <BorderButton
              className="flex items-center gap-2 rounded-xl"
              onClick={() => navigate("/dashboard")}
              aria-label={formatMessage({ defaultMessage: "Go Live" })}
            >
              <Icon name="clapperboard" size={18} />
              <span className="max-md:hidden">
                <FormattedMessage defaultMessage="Go Live" />
              </span>
            </BorderButton>
            <Menu
              menuClassName="ctx-menu"
              menuButton={
                <IconButton iconName="plus-circle" iconSize={20} className="px-3 py-2 hover:bg-layer-2 rounded-xl" />
              }
              align="end"
              gap={5}
            >
              <MenuItem onClick={() => navigate("/upload")}>
                <Icon name="upload" size={24} />
                <FormattedMessage defaultMessage="Upload" />
              </MenuItem>
              <MenuItem onClick={() => navigate("/widgets")}>
                <Icon name="widget" size={24} />
                <FormattedMessage defaultMessage="Widgets" />
              </MenuItem>
            </Menu>
          </>
        )}
        <Menu
          menuClassName="ctx-menu"
          menuButton={
            <div className="profile-menu">
              <Profile
                avatarSize={32}
                pubkey={login.pubkey}
                options={{
                  showName: false,
                }}
                linkToProfile={false}
              />
            </div>
          }
          align="end"
          gap={5}
        >
          <MenuItem onClick={() => navigate(profileLink(undefined, login.pubkey))}>
            <Icon name="user" size={24} />
            <FormattedMessage defaultMessage="Profile" />
          </MenuItem>
          <MenuItem onClick={() => navigate("/settings")}>
            <Icon name="settings" size={24} />
            <FormattedMessage defaultMessage="Settings" />
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={() => navigate("/faq")}>
            <Icon name="message-circle" size={24} />
            <FormattedMessage defaultMessage="FAQ" />
          </MenuItem>
          <MenuItem onClick={() => window.open("https://web.nostrord.com/#/g/relay.zap.stream/acleprush")}>
            <Icon name="message-circle" size={24} />
            Chat
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={() => Login.logout()}>
            <Icon name="logout" size={24} />
            <FormattedMessage defaultMessage="Logout" />
          </MenuItem>
        </Menu>
      </div>
    )
  }

  function loggedOut() {
    if (login) return
    return (
      <div>
        <PrimaryButton className="rounded-xl" onClick={() => setShowLogin(true)}>
          <FormattedMessage defaultMessage="Login" id="AyGauy" />
        </PrimaryButton>
        {showLogin && (
          <Modal
            id="login"
            onClose={() => setShowLogin(false)}
            bodyClassName="relative bg-layer-1 rounded-3xl overflow-hidden my-auto lg:w-[500px] max-lg:w-full"
            showClose={false}
          >
            <LoginSignup close={() => setShowLogin(false)} />
          </Modal>
        )}
      </div>
    )
  }

  if (!layoutState.showHeader) return
  return (
    <div className="flex justify-between items-center gap-4 px-4 h-[var(--header-height)] border-b border-layer-3 bg-layer-0/90 backdrop-blur sticky top-0 z-10">
      <div className="flex gap-3 items-center">
        {layoutState.leftNav && (
          <NavLinkIcon
            name="hamburger"
            className="!text-text xl:hidden"
            onClick={() => {
              layoutState.update(c => {
                c.leftNavExpand = !c.leftNavExpand
                return { ...c }
              })
            }}
          />
        )}
        <Link to="/" className="flex items-center gap-2 text-primary">
          <Logo width={30} />
          <span className="font-display text-xl font-extrabold tracking-tight text-text max-md:hidden">
            zap<span className="text-primary">.</span>stream
          </span>
        </Link>
      </div>
      <SearchBar />
      <div className="flex items-center gap-3">
        {langSelector()}
        {loggedIn()}
        {loggedOut()}
      </div>
    </div>
  )
}
