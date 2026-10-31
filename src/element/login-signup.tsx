import { type FormEvent, type ReactElement, type ReactNode, cloneElement, useContext, useId, useState } from "react"
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl"
import { EventPublisher, PrivateKeySigner, type UserMetadata } from "@snort/system"
import { LNURL, hexToBech32 } from "@snort/shared"
import { SnortContext } from "@snort/system-react"
import classNames from "classnames"

import { Login, LoginType } from "@/login"
import { Icon } from "./icon"
import Logo from "./logo"
import Copy from "./copy"
import { type AccountResponse, NostrStreamProvider, adaptPublisher } from "@/providers"
import { IconButton, PrimaryButton } from "./buttons"
import { ExternalLink } from "./external-link"
import { FileUploader } from "./file-uploader"
import { useStreamProvider } from "@/hooks/stream-provider"
import { gtag } from "@/gtm"
import { defaultLightningAddress, lightningAddressCheckRequired, parsePrivateKey } from "./login-keys"

enum Stage {
  Start = 0,
  PrivateKey = 1,
  Profile = 2,
  Wallet = 3,
  SaveKey = 4,
}

const signupSteps = [Stage.Profile, Stage.Wallet, Stage.SaveKey]

function errorText(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function StageHeader({
  title,
  subtitle,
  onBack,
  step,
}: {
  title: ReactNode
  subtitle?: ReactNode
  onBack?: () => void
  step?: number
}) {
  const { formatMessage } = useIntl()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 min-h-9 pr-10">
        {onBack && (
          <IconButton
            iconName="chevron-left"
            iconSize={16}
            onClick={onBack}
            className="rounded-full aspect-square bg-layer-2 hover:bg-layer-3 p-2.5"
            aria-label={formatMessage({ defaultMessage: "Back" })}
          />
        )}
        {step !== undefined && (
          <div className="flex flex-1 gap-1.5">
            {signupSteps.map((s, i) => (
              <div key={s} className={classNames("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-layer-3")} />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <h2>{title}</h2>
        {subtitle && <p className="text-layer-5 text-[15px]">{subtitle}</p>}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactElement }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <label htmlFor={id} className="text-sm text-layer-4">
        {label}
      </label>
      {cloneElement(children as ReactElement<{ id: string }>, { id })}
      {hint && <small className="text-layer-4">{hint}</small>}
    </div>
  )
}

function LoginOption({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string
  title: ReactNode
  subtitle: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-layer-3 hover:border-layer-4 hover:bg-layer-2 px-4 py-3 text-left transition"
    >
      <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-layer-2">
        <Icon name={icon} size={20} />
      </span>
      <span className="flex flex-col flex-1 min-w-0">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-layer-4">{subtitle}</span>
      </span>
      <Icon name="chevron-right" size={16} className="text-layer-4" />
    </button>
  )
}

function ErrorMessage({ error }: { error: string }) {
  if (!error) return
  return <p className="text-sm text-warning bg-warning/10 rounded-xl px-3 py-2">{error}</p>
}

export function LoginSignup({ close }: { close: () => void }) {
  const system = useContext(SnortContext)
  const [error, setError] = useState("")
  const [stage, setStageRaw] = useState(Stage.Start)
  const [username, setUsername] = useState("")
  const [lnAddress, setLnAddress] = useState("")
  const [providerInfo, setProviderInfo] = useState<AccountResponse>()
  const [avatar, setAvatar] = useState("")
  const [key, setKey] = useState("")
  const [keySaved, setKeySaved] = useState(false)
  const { formatMessage } = useIntl()
  const hasNostrExtension = typeof window !== "undefined" && "nostr" in window && Boolean(window.nostr)
  const { config } = useStreamProvider()

  function setStage(s: Stage) {
    setError("")
    setStageRaw(s)
  }

  function loginPrivateKey(e: FormEvent) {
    e.preventDefault()
    try {
      Login.loginWithPrivateKey(parsePrivateKey(key))
      close()
    } catch {
      setError(formatMessage({ defaultMessage: "That doesn't look like a valid private key" }))
    }
  }

  async function loginNip7() {
    setError("")
    try {
      const nip7 = await EventPublisher.nip7()
      if (nip7) {
        Login.loginWithPubkey(nip7.pubKey, LoginType.Nip7)
        close()
      }
    } catch (e) {
      setError(errorText(e))
    }
  }

  function createAccount() {
    const signer = PrivateKeySigner.random()
    setKey(signer.privateKey)
    setLnAddress(defaultLightningAddress(signer.privateKey, window.location.host))
    setStage(Stage.Profile)
  }

  async function saveName() {
    try {
      const px = new NostrStreamProvider(config.name, config.url, adaptPublisher(EventPublisher.privateKey(key)))
      setProviderInfo(await px.info())
    } catch (e) {
      console.error(e)
    }
    setStage(Stage.Wallet)
  }

  async function saveProfile() {
    setError("")
    try {
      if (lightningAddressCheckRequired(lnAddress, import.meta.env.DEV)) {
        try {
          const lnurl = new LNURL(lnAddress)
          await lnurl.load()
        } catch {
          throw new Error(
            formatMessage({
              defaultMessage: "Hmm, your lightning address looks wrong",
              id: "4l69eO",
            }),
          )
        }
      }
      const profile = {
        name: username,
        picture: avatar,
        lud16: lnAddress,
      } as UserMetadata
      const ev = await EventPublisher.privateKey(key).metadata(profile)
      system.BroadcastEvent(ev)
      setStage(Stage.SaveKey)
    } catch (e) {
      setError(errorText(e))
    }
  }

  function finishSignup() {
    Login.loginWithPrivateKey(key)
    gtag("event", "conversion", {
      send_to: "AW-17854661671/Rr6ECM36090bEKeI4sFC",
    })
    close()
  }

  function avatarUpload() {
    const signer = new PrivateKeySigner(key)
    return (
      <FileUploader
        publisher={new EventPublisher(signer, signer.getPubKey())}
        onResult={e => setAvatar(e ?? "")}
        onError={e => setError(e.toString())}
        className="relative w-24 h-24 rounded-full overflow-hidden bg-layer-2 border border-layer-3 hover:border-layer-4 cursor-pointer group"
        imageWidth={512}
        imageHeight={512}
      >
        {avatar && <img className="absolute inset-0 object-cover w-full h-full" src={avatar} alt="" />}
        <span
          className={classNames(
            "absolute inset-0 flex items-center justify-center transition",
            avatar ? "bg-black/50 opacity-0 group-hover:opacity-100" : "text-layer-4",
          )}
        >
          <Icon name="camera-plus" size={24} />
        </span>
      </FileUploader>
    )
  }

  switch (stage) {
    case Stage.Start: {
      return (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-3 pt-2">
            <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 text-primary">
              <Logo width={30} />
            </span>
            <h2>
              <FormattedMessage defaultMessage="Welcome to zap.stream" />
            </h2>
            <p className="text-layer-5 text-[15px] max-w-[320px]">
              <FormattedMessage defaultMessage="Watch, stream and get paid in sats. No email or password needed." />
            </p>
          </div>
          <PrimaryButton onClick={createAccount} className="w-full !py-3 !text-base">
            <FormattedMessage defaultMessage="Create an account" />
          </PrimaryButton>
          <div className="flex items-center gap-3 text-sm text-layer-4">
            <div className="h-px flex-1 bg-layer-3" />
            <FormattedMessage defaultMessage="Already on nostr?" />
            <div className="h-px flex-1 bg-layer-3" />
          </div>
          <div className="flex flex-col gap-2">
            <LoginOption
              icon="nostrich"
              title={<FormattedMessage defaultMessage="Nostr extension" />}
              subtitle={
                hasNostrExtension ? (
                  <FormattedMessage defaultMessage="Recommended. Your key stays in the extension." />
                ) : (
                  <FormattedMessage defaultMessage="No extension found in this browser" />
                )
              }
              onClick={loginNip7}
            />
            <LoginOption
              icon="login"
              title={<FormattedMessage defaultMessage="Private key" />}
              subtitle={<FormattedMessage defaultMessage="Paste your nsec. Less secure." />}
              onClick={() => setStage(Stage.PrivateKey)}
            />
          </div>
          {!hasNostrExtension && (
            <small className="text-layer-4 text-center">
              <FormattedMessage
                defaultMessage="Get an extension: {alby}, {nos2x} or {nostore}"
                values={{
                  alby: <ExternalLink href="https://getalby.com/">Alby</ExternalLink>,
                  nos2x: (
                    <ExternalLink href="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp">
                      nos2x
                    </ExternalLink>
                  ),
                  nostore: (
                    <ExternalLink href="https://apps.apple.com/us/app/nostore/id1666553677">Nostore</ExternalLink>
                  ),
                }}
              />
            </small>
          )}
          <ErrorMessage error={error} />
        </div>
      )
    }
    case Stage.PrivateKey: {
      return (
        <form className="flex flex-col gap-5" onSubmit={loginPrivateKey}>
          <StageHeader
            onBack={() => {
              setKey("")
              setStage(Stage.Start)
            }}
            title={<FormattedMessage defaultMessage="Log in with private key" />}
            subtitle={
              <FormattedMessage
                defaultMessage="Your key is stored in this browser. A {link} keeps it safer."
                values={{
                  link: (
                    <ExternalLink href="https://getalby.com/">
                      <FormattedMessage defaultMessage="signer extension" />
                    </ExternalLink>
                  ),
                }}
              />
            }
          />
          <Field label={<FormattedMessage defaultMessage="Private key" />}>
            <input
              type="password"
              autoComplete="off"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="nsec1..."
            />
          </Field>
          <ErrorMessage error={error} />
          <PrimaryButton type="submit" disabled={key.trim().length === 0} className="w-full !py-3 !text-base">
            <FormattedMessage defaultMessage="Log In" id="r2Jjms" />
          </PrimaryButton>
        </form>
      )
    }
    case Stage.Profile: {
      return (
        <div className="flex flex-col gap-5">
          <StageHeader
            step={0}
            onBack={() => {
              setKey("")
              setStage(Stage.Start)
            }}
            title={<FormattedMessage defaultMessage="Set up your profile" />}
            subtitle={<FormattedMessage defaultMessage="This is how viewers will see you. You can change it later." />}
          />
          <div className="flex items-center gap-4">
            {avatarUpload()}
            <Field label={<FormattedMessage defaultMessage="Display name" />}>
              <input
                type="text"
                placeholder={formatMessage({ defaultMessage: "Satoshi" })}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </Field>
          </div>
          <ErrorMessage error={error} />
          <PrimaryButton onClick={saveName} disabled={username.trim().length === 0} className="w-full !py-3 !text-base">
            <FormattedMessage defaultMessage="Continue" />
          </PrimaryButton>
        </div>
      )
    }
    case Stage.Wallet: {
      return (
        <div className="flex flex-col gap-5">
          <StageHeader
            step={1}
            onBack={() => setStage(Stage.Profile)}
            title={<FormattedMessage defaultMessage="Get paid by viewers" />}
            subtitle={
              <FormattedMessage defaultMessage="Zaps from viewers go to this lightning address. We made you one, or paste your own." />
            }
          />
          {(providerInfo?.balance ?? 0) > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3">
              <Icon name="zap-filled" className="text-primary shrink-0" />
              <span className="text-sm">
                <FormattedMessage
                  defaultMessage="You have {n} sats of free streaming on us."
                  values={{
                    n: <FormattedNumber value={providerInfo?.balance ?? 0} />,
                  }}
                />
              </span>
            </div>
          )}
          <Field
            label={<FormattedMessage defaultMessage="Lightning address" />}
            hint={<FormattedMessage defaultMessage="You can always replace it with your own address later." />}
          >
            <input
              type="text"
              placeholder={formatMessage({ defaultMessage: "eg. name@wallet.com" })}
              value={lnAddress}
              onChange={e => setLnAddress(e.target.value)}
            />
          </Field>
          <ErrorMessage error={error} />
          <PrimaryButton
            onClick={saveProfile}
            disabled={lnAddress.trim().length === 0}
            className="w-full !py-3 !text-base"
          >
            <FormattedMessage defaultMessage="Continue" />
          </PrimaryButton>
        </div>
      )
    }
    case Stage.SaveKey: {
      return (
        <div className="flex flex-col gap-5">
          <StageHeader
            step={2}
            title={<FormattedMessage defaultMessage="Save your key" />}
            subtitle={
              <FormattedMessage defaultMessage="This key is your account. There is no password reset, so if you lose it, the account is gone for good." />
            }
          />
          <div className="flex items-center rounded-xl bg-layer-2 border border-layer-3 px-4 py-3 font-mono text-sm min-w-0 overflow-hidden">
            <Copy text={hexToBech32("nsec", key)} maxSize={28} className="w-full min-w-0 justify-between" />
          </div>
          <label className="flex items-start gap-3 cursor-pointer text-sm text-layer-5">
            <input
              type="checkbox"
              className="mt-0.5 accent-primary w-4 h-4"
              checked={keySaved}
              onChange={e => setKeySaved(e.target.checked)}
            />
            <FormattedMessage defaultMessage="I saved my key somewhere safe, like a password manager" />
          </label>
          <PrimaryButton onClick={finishSignup} disabled={!keySaved} className="w-full !py-3 !text-base">
            <FormattedMessage defaultMessage="Finish" />
          </PrimaryButton>
        </div>
      )
    }
  }
}
