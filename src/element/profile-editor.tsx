import { useState, useEffect, useContext } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { LNURL, fetchNip05Pubkey } from "@snort/shared";
import { mapEventToProfile } from "@snort/system";
import { SnortContext, useUserProfile } from "@snort/system-react";
import { useLogin } from "@/hooks/login";
import { debounce, openFile } from "@/utils";
import { PrimaryButton } from "./buttons";
import { VoidApi } from "@void-cat/api";

const MaxUsernameLength = 100;
const MaxAboutLength = 500;

export function ProfileEditor({ onClose }: { onClose: () => void }) {
  const login = useLogin();
  const user = useUserProfile(login?.pubkey);
  const { formatMessage } = useIntl();
  const system = useContext(SnortContext);

  const [error, setError] = useState<Error>();
  const [name, setName] = useState<string>();
  const [picture, setPicture] = useState<string>();
  const [banner, setBanner] = useState<string>();
  const [about, setAbout] = useState<string>();
  const [website, setWebsite] = useState<string>();
  const [nip05, setNip05] = useState<string>();
  const [lud16, setLud16] = useState<string>();
  const [nip05AddressValid, setNip05AddressValid] = useState<boolean>();
  const [invalidNip05AddressMessage, setInvalidNip05AddressMessage] = useState<string>();
  const [usernameValid, setUsernameValid] = useState<boolean>();
  const [invalidUsernameMessage, setInvalidUsernameMessage] = useState<string>();
  const [aboutValid, setAboutValid] = useState<boolean>();
  const [invalidAboutMessage, setInvalidAboutMessage] = useState<string>();
  const [lud16Valid, setLud16Valid] = useState<boolean>();
  const [invalidLud16Message, setInvalidLud16Message] = useState<string>();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPicture(user.picture);
      setBanner(user.banner);
      setAbout(user.about);
      setWebsite(user.website);
      setNip05(user.nip05);
      setLud16(user.lud16);
    }
  }, [user]);

  useEffect(() => {
    return debounce(500, async () => {
      if (lud16) {
        try {
          await new LNURL(lud16).load();
          setLud16Valid(true);
          setInvalidLud16Message("");
        } catch (e) {
          setLud16Valid(false);
          setInvalidLud16Message(
            formatMessage({
              defaultMessage: "Invalid lightning address",
            }),
          );
        }
      } else {
        setInvalidLud16Message("");
      }
    });
  }, [formatMessage, lud16]);

  useEffect(() => {
    async function nip05NostrAddressVerification(nip05Domain: string | undefined, nip05Name: string | undefined) {
      try {
        const result = await fetchNip05Pubkey(nip05Name!, nip05Domain!);
        if (result) {
          if (result === login?.pubkey) {
            setNip05AddressValid(true);
          } else {
            setInvalidNip05AddressMessage(
              formatMessage({ defaultMessage: "Nostr address does not belong to you", id: "01iNut" }),
            );
          }
        } else {
          setNip05AddressValid(false);
          setInvalidNip05AddressMessage(
            formatMessage({
              defaultMessage: "Invalid nostr address",
            }),
          );
        }
      } catch (e) {
        setNip05AddressValid(false);
        setInvalidNip05AddressMessage(
          formatMessage({
            defaultMessage: "Invalid nostr address",
          }),
        );
      }
    }
    return debounce(500, async () => {
      const Nip05AddressElements = nip05?.split("@") ?? [];
      if ((nip05?.length ?? 0) === 0) {
        setNip05AddressValid(false);
        setInvalidNip05AddressMessage("");
      } else if (Nip05AddressElements.length < 2) {
        setNip05AddressValid(false);
        setInvalidNip05AddressMessage(
          formatMessage({
            defaultMessage: "Invalid nostr address",
          }),
        );
      } else if (Nip05AddressElements.length === 2) {
        nip05NostrAddressVerification(Nip05AddressElements.pop(), Nip05AddressElements.pop());
      } else {
        setNip05AddressValid(false);
      }
    });
  }, [formatMessage, login?.pubkey, nip05]);

  async function uploadAvatar() {
    const defaultError = formatMessage({
      defaultMessage: "Avatar upload fialed",
      id: "uTonxS",
    });

    setError(undefined);
    try {
      const file = await openFile();
      if (file) {
        const VoidCatHost = "https://void.cat";
        const api = new VoidApi(VoidCatHost);
        const uploader = api.getUploader(file);
        const result = await uploader.upload({
          "V-Strip-Metadata": "true",
        });
        console.debug(result);
        if (result.ok) {
          const resultUrl = result.file?.metadata?.url ?? `${VoidCatHost}/d/${result.file?.id}`;
          setPicture(resultUrl);
        } else {
          setError(new Error(result.errorMessage ?? defaultError));
        }
      }
    } catch {
      setError(new Error(defaultError));
    }
  }

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
    } as Record<string, string | number | undefined | boolean>;
    delete userCopy["loaded"];
    delete userCopy["created"];
    delete userCopy["pubkey"];
    delete userCopy["npub"];
    delete userCopy["deleted"];
    delete userCopy["zapService"];
    delete userCopy["isNostrAddressValid"];
    console.debug(userCopy);

    const publisher = login?.publisher();
    if (publisher) {
      const ev = await publisher.metadata(userCopy);
      system.BroadcastEvent(ev);

      const newProfile = mapEventToProfile(ev);
      if (newProfile) {
        await system.profileLoader.cache.update(newProfile);
      }
      onClose();
    }
  }

  async function onNip05Change(e: React.ChangeEvent<HTMLInputElement>) {
    const Nip05Address = e.target.value.toLowerCase();
    setNip05(Nip05Address);
  }

  async function onLimitCheck(val: string, field: string) {
    if (field === "username") {
      setName(val);
      if (val?.length >= MaxUsernameLength) {
        setUsernameValid(false);
        setInvalidUsernameMessage(
          formatMessage({
            defaultMessage: "Username is too long",
          }),
        );
      } else {
        setUsernameValid(true);
        setInvalidUsernameMessage("");
      }
    } else if (field === "about") {
      setAbout(val);
      if (val?.length >= MaxAboutLength) {
        setAboutValid(false);
        setInvalidAboutMessage(
          formatMessage({
            defaultMessage: "About too long",
          }),
        );
      } else {
        setAboutValid(true);
        setInvalidAboutMessage("");
      }
    }
  }

  async function onLud16Change(address: string) {
    setLud16(address);
  }

  function editor() {
    if (!login?.pubkey) return;

    return (
      <div className="flex flex-col gap-4">
        <div className="mx-auto relative flex items-center justify-center w-40 h-40 aspect-square rounded-full overflow-hidden">
          <img className="absolute w-full h-full object-cover" src={picture} />
          <div
            className="flex items-center justify-center absolute w-full h-full opacity-0 hover:opacity-80 bg-foreground cursor-pointer"
            onClick={() => uploadAvatar()}>
            <FormattedMessage defaultMessage="Edit" />
          </div>
        </div>
        <div className="flex flex-col w-full gap-2">
          <h4>
            <FormattedMessage defaultMessage="Name" />
          </h4>
          <input
            className="w-full"
            type="text"
            value={name}
            onChange={e => onLimitCheck(e.target.value, "username")}
            maxLength={MaxUsernameLength}
          />
          <div>{usernameValid === false ? <span className="text-delete">{invalidUsernameMessage}</span> : <></>}</div>
        </div>
        <div className="flex flex-col w-full gap-2">
          <h4>
            <FormattedMessage defaultMessage="About" />
          </h4>
          <textarea
            className="w-full"
            onChange={e => onLimitCheck(e.target.value, "about")}
            value={about}
            maxLength={MaxAboutLength}></textarea>
          <div>{aboutValid === false ? <span className="text-delete">{invalidAboutMessage}</span> : <></>}</div>
        </div>
        <div className="flex flex-col w-full gap-2">
          <h4>
            <FormattedMessage defaultMessage="Website" />
          </h4>
          <input className="w-full" type="text" value={website} onChange={e => setWebsite(e.target.value)} />
        </div>
        <div className="flex flex-col w-full gap-2">
          <h4>
            <FormattedMessage defaultMessage="Nostr Address" />
          </h4>
          <div className="flex flex-col gap-2 w-full">
            <input type="text" className="w-full" value={nip05} onChange={e => onNip05Change(e)} />
            <div>{!nip05AddressValid && <span className="text-delete">{invalidNip05AddressMessage}</span>}</div>
            <small>
              <FormattedMessage defaultMessage="Usernames are not unique on Nostr. The nostr address is your unique human-readable address that is unique to you upon registration." />
            </small>
          </div>
        </div>
        <div className="flex flex-col w-full gap-2">
          <h4>
            <FormattedMessage defaultMessage="Lightning Address" />
          </h4>
          <input
            className="w-full"
            type="text"
            value={lud16}
            onChange={e => onLud16Change(e.target.value.toLowerCase())}
          />
          <div>{lud16Valid === false ? <span className="text-delete">{invalidLud16Message}</span> : <></>}</div>
        </div>
        {error && <b className="text-delete">{error.message}</b>}
        <PrimaryButton onClick={() => saveProfile()}>
          <FormattedMessage defaultMessage="Save" />
        </PrimaryButton>
      </div>
    );
  }

  return editor();
}
