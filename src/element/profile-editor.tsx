import { type ReactNode, useState, useEffect, useContext, useRef } from "react"
import { FormattedMessage, useIntl } from "react-intl"
import { LNURL, fetchNip05Pubkey } from "@snort/shared"
import { mapEventToProfile } from "@snort/system"
import { SnortContext, useUserProfile } from "@snort/system-react"
import { useLogin } from "@/hooks/login"
import { debounce } from "@/utils"
import { PrimaryButton } from "./buttons"
import { FileUploader } from "./file-uploader"

const MaxUsernameLength = 100
const MaxAboutLength = 500

export function ProfileEditor({ onClose }: { onClose: () => void }) {
  const login = useLogin()
  const user = useUserProfile(login?.pubkey)
  const { formatMessage } = useIntl()
  const system = useContext(SnortContext)

  const [error, setError] = useState<Error>()
  const [name, setName] = useState<string>()
  const [picture, setPicture] = useState<string>()
  const [banner, setBanner] = useState<string>()
  const [about, setAbout] = useState<string>()
  const [website, setWebsite] = useState<string>()
  const [nip05, setNip05] = useState<string>()
  const [lud16, setLud16] = useState<string>()
  const [nip05AddressValid, setNip05AddressValid] = useState<boolean>()
  const [invalidNip05AddressMessage, setInvalidNip05AddressMessage] = useState<string>()
  const [usernameValid, setUsernameValid] = useState<boolean>()
  const [invalidUsernameMessage, setInvalidUsernameMessage] = useState<string>()
  const [aboutValid, setAboutValid] = useState<boolean>()
  const [invalidAboutMessage, setInvalidAboutMessage] = useState<string>()
  const [lud16Valid, setLud16Valid] = useState<boolean>()
  const [invalidLud16Message, setInvalidLud16Message] = useState<string>()

  const seeded = useRef(false)

  useEffect(() => {
    if (user && !seeded.current) {
      seeded.current = true
      setName(user.name)
      setPicture(user.picture)
      setBanner(user.banner)
      setAbout(user.about)
      setWebsite(user.website)
      setNip05(user.nip05)
      setLud16(user.lud16)
    }
  }, [user])

  useEffect(() => {
    return debounce(500, async () => {
      if (lud16) {
        try {
          await new LNURL(lud16).load()
          setLud16Valid(true)
          setInvalidLud16Message("")
        } catch (_e) {
          setLud16Valid(false)
          setInvalidLud16Message(
            formatMessage({
              defaultMessage: "Invalid lightning address",
            }),
          )
        }
      } else {
        setInvalidLud16Message("")
      }
    })
  }, [formatMessage, lud16])

  useEffect(() => {
    async function nip05NostrAddressVerification(nip05Domain: string | undefined, nip05Name: string | undefined) {
      if (!nip05Name || !nip05Domain) return
      try {
        const result = await fetchNip05Pubkey(nip05Name, nip05Domain)
        if (result) {
          if (result === login?.pubkey) {
            setNip05AddressValid(true)
          } else {
            setNip05AddressValid(false)
            setInvalidNip05AddressMessage(
              formatMessage({ defaultMessage: "Nostr address does not belong to you", id: "01iNut" }),
            )
          }
        } else {
          setNip05AddressValid(false)
          setInvalidNip05AddressMessage(
            formatMessage({
              defaultMessage: "Invalid nostr address",
            }),
          )
        }
      } catch (_e) {
        setNip05AddressValid(false)
        setInvalidNip05AddressMessage(
          formatMessage({
            defaultMessage: "Invalid nostr address",
          }),
        )
      }
    }
    return debounce(500, async () => {
      const Nip05AddressElements = nip05?.split("@") ?? []
      if ((nip05?.length ?? 0) === 0) {
        setNip05AddressValid(false)
        setInvalidNip05AddressMessage("")
      } else if (Nip05AddressElements.length < 2) {
        setNip05AddressValid(false)
        setInvalidNip05AddressMessage(
          formatMessage({
            defaultMessage: "Invalid nostr address",
          }),
        )
      } else if (Nip05AddressElements.length === 2) {
        nip05NostrAddressVerification(Nip05AddressElements.pop(), Nip05AddressElements.pop())
      } else {
        setNip05AddressValid(false)
      }
    })
  }, [formatMessage, login?.pubkey, nip05])

  async function saveProfile() {
    // copy user object and delete internal fields
    const userCopy = {
      ...user,
      name,
      about,
      picture,
      banner,
      website,
      nip05,
      lud16,
    } as Record<string, string | number | undefined | boolean>
    delete userCopy.loaded
    delete userCopy.created
    delete userCopy.pubkey
    delete userCopy.npub
    delete userCopy.deleted
    delete userCopy.zapService
    delete userCopy.isNostrAddressValid
    console.debug(userCopy)

    const publisher = login?.publisher()
    if (publisher) {
      const ev = await publisher.metadata(userCopy)
      system.BroadcastEvent(ev)

      const newProfile = mapEventToProfile(ev)
      if (newProfile) {
        await system.profileLoader.cache.update(newProfile)
      }
      onClose()
    }
  }

  async function onNip05Change(e: React.ChangeEvent<HTMLInputElement>) {
    const Nip05Address = e.target.value.toLowerCase()
    setNip05(Nip05Address)
  }

  async function onLimitCheck(val: string, field: string) {
    if (field === "username") {
      setName(val)
      if (val?.length >= MaxUsernameLength) {
        setUsernameValid(false)
        setInvalidUsernameMessage(
          formatMessage({
            defaultMessage: "Username is too long",
          }),
        )
      } else {
        setUsernameValid(true)
        setInvalidUsernameMessage("")
      }
    } else if (field === "about") {
      setAbout(val)
      if (val?.length >= MaxAboutLength) {
        setAboutValid(false)
        setInvalidAboutMessage(
          formatMessage({
            defaultMessage: "About too long",
          }),
        )
      } else {
        setAboutValid(true)
        setInvalidAboutMessage("")
      }
    }
  }

  async function onLud16Change(address: string) {
    setLud16(address)
  }

  function editor() {
    if (!login?.pubkey) return

    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden bg-layer-2 border border-layer-3">
            {picture && <img className="absolute w-full h-full object-cover" src={picture} alt="" />}
            <FileUploader
              onResult={e => setPicture(e ?? "")}
              onError={e => setError(e instanceof Error ? e : new Error(e))}
              className="flex items-center justify-center absolute w-full h-full opacity-0 hover:opacity-100 bg-layer-0/70 text-sm font-semibold cursor-pointer"
              imageWidth={512}
              imageHeight={512}
            >
              <FormattedMessage defaultMessage="Edit" />
            </FileUploader>
          </div>
          <p className="text-sm text-layer-4">
            <FormattedMessage defaultMessage="Click your picture to upload a new one." />
          </p>
        </div>
        <ProfileField
          id="profile-name"
          label={<FormattedMessage defaultMessage="Name" />}
          error={usernameValid === false && invalidUsernameMessage}
        >
          <input
            id="profile-name"
            type="text"
            value={name ?? ""}
            onChange={e => onLimitCheck(e.target.value, "username")}
            maxLength={MaxUsernameLength}
          />
        </ProfileField>
        <ProfileField
          id="profile-about"
          label={<FormattedMessage defaultMessage="About" />}
          error={aboutValid === false && invalidAboutMessage}
        >
          <textarea
            id="profile-about"
            rows={4}
            onChange={e => onLimitCheck(e.target.value, "about")}
            value={about ?? ""}
            maxLength={MaxAboutLength}
          ></textarea>
        </ProfileField>
        <ProfileField id="profile-website" label={<FormattedMessage defaultMessage="Website" />}>
          <input id="profile-website" type="text" value={website ?? ""} onChange={e => setWebsite(e.target.value)} />
        </ProfileField>
        <ProfileField
          id="profile-nip05"
          label={<FormattedMessage defaultMessage="Nostr Address" />}
          error={!nip05AddressValid && invalidNip05AddressMessage}
          hint={
            <FormattedMessage defaultMessage="Usernames are not unique on Nostr. The nostr address is your unique human-readable address that is unique to you upon registration." />
          }
        >
          <input id="profile-nip05" type="text" value={nip05 ?? ""} onChange={e => onNip05Change(e)} />
        </ProfileField>
        <ProfileField
          id="profile-lud16"
          label={<FormattedMessage defaultMessage="Lightning Address" />}
          error={lud16Valid === false && invalidLud16Message}
        >
          <input
            id="profile-lud16"
            type="text"
            value={lud16 ?? ""}
            onChange={e => onLud16Change(e.target.value.toLowerCase())}
          />
        </ProfileField>
        {error && <b className="text-warning">{error.message}</b>}
        <PrimaryButton className="self-start !px-6 !py-2.5" onClick={() => saveProfile()}>
          <FormattedMessage defaultMessage="Save" />
        </PrimaryButton>
      </div>
    )
  }

  return editor()
}

function ProfileField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-layer-4">
        {label}
      </label>
      {children}
      {error && <span className="text-sm text-warning">{error}</span>}
      {hint && <span className="text-sm text-layer-4">{hint}</span>}
    </div>
  )
}
