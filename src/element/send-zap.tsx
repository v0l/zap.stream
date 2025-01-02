import "./send-zap.css";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import { LNURL } from "@snort/shared";
import { EventPublisher, NostrEvent, TaggedNostrEvent } from "@snort/system";
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "@noble/curves/abstract/utils";
import { FormattedMessage, FormattedNumber } from "react-intl";

import { formatSats } from "../number";
import { Icon } from "./icon";
import QrCode from "./qr-code";
import { useLogin } from "@/hooks/login";
import Copy from "./copy";
import { defaultRelays } from "@/const";
import { useRates } from "@/hooks/rates";
import { DefaultButton, PrimaryButton } from "./buttons";
import Modal from "./modal";
import Pill from "./pill";
import { useUserProfile } from "@snort/system-react";
import { getHost } from "@/utils";
import { getName } from "./profile";
import { useWallet } from "@/hooks/wallet";

export interface LNURLLike {
  get name(): string;
  get maxCommentLength(): number;
  get canZap(): boolean;
  getInvoice(amountInSats: number, comment?: string, zap?: NostrEvent): Promise<{ pr?: string }>;
}

export interface SendZapsProps {
  lnurl: string | LNURLLike;
  pubkey?: string;
  aTag?: string;
  eTag?: string;
  targetName?: string;
  onFinish: () => void;
  onTargetReady?: () => void;
  button?: ReactNode;
}

export function SendZaps({ lnurl, pubkey, aTag, eTag, targetName, onFinish, onTargetReady }: SendZapsProps) {
  const satsAmounts = [
    21, 69, 121, 420, 1_000, 2_100, 4_200, 10_000, 21_000, 42_000, 69_000, 100_000, 210_000, 500_000, 1_000_000,
  ];
  const usdAmounts = [0.05, 0.5, 2, 5, 10, 50, 100, 200];
  const [isFiat, setIsFiat] = useState(false);
  const [svc, setSvc] = useState<LNURLLike>();
  const [customAmount, setCustomAmount] = useState(false);
  const [amount, setAmount] = useState(satsAmounts[0]);
  const [comment, setComment] = useState("");
  const [invoice, setInvoice] = useState("");
  const login = useLogin();
  const wallet = useWallet();
  const rate = useRates("BTCUSD");
  const relays = Object.keys(defaultRelays);
  const name = targetName ?? svc?.name;
  async function loadService(lnurl: string) {
    const s = new LNURL(lnurl);
    await s.load();
    setSvc(s);
  }
  const usdRate = rate.time ? rate.ask : 26_000;

  useEffect(() => {
    if (!svc) {
      if (typeof lnurl === "string") {
        loadService(lnurl)
          .then(() => {
            onTargetReady?.();
          })
          .catch(console.warn);
      } else {
        setSvc(lnurl);
        onTargetReady?.();
      }
    }
  }, [lnurl]);

  async function send() {
    if (!svc) return;
    let pub = login?.publisher();
    let isAnon = false;
    if (!pub) {
      pub = EventPublisher.privateKey(bytesToHex(secp256k1.utils.randomPrivateKey()));
      isAnon = true;
    }

    const amountInSats = isFiat ? Math.floor((amount / usdRate) * 1e8) : amount;
    let zap: NostrEvent | undefined;
    if (pubkey) {
      zap = await pub.zap(amountInSats * 1000, pubkey, relays, undefined, comment, eb => {
        if (aTag) {
          eb.tag(["a", aTag]);
        }
        if (eTag) {
          eb.tag(["e", eTag]);
        }
        if (isAnon) {
          eb.tag(["anon", ""]);
        }
        return eb;
      });
    }
    const invoice = await svc.getInvoice(amountInSats, comment, zap);
    if (!invoice.pr) return;

    if (wallet) {
      try {
        await wallet.payInvoice(invoice.pr);
        onFinish();
      } catch (error) {
        setInvoice(invoice.pr);
      }
    } else {
      setInvoice(invoice.pr);
    }
  }

  function input() {
    if (invoice) return;
    return (
      <>
        <div className="flex gap-2">
          <Pill
            selected={!isFiat}
            onClick={() => {
              setIsFiat(false);
              setAmount(satsAmounts[0]);
            }}>
            SATS
          </Pill>
          <Pill
            selected={isFiat}
            onClick={() => {
              setIsFiat(true);
              setAmount(usdAmounts[0]);
            }}>
            USD
          </Pill>
        </div>
        <div className="flex flex-col gap-2">
          <small>
            <FormattedMessage
              defaultMessage="Zap amount in {currency}"
              values={{ currency: isFiat ? "USD" : "SATS" }}
            />
            {isFiat && (
              <>
                &nbsp;
                <FormattedMessage
                  defaultMessage="@ {rate}"
                  description="Showing zap amount in USD @ rate"
                  values={{
                    rate: <FormattedNumber value={usdRate} />,
                  }}
                />
              </>
            )}
          </small>
          <div className="grid grid-cols-5 gap-2 text-center">
            {!customAmount &&
              (isFiat ? usdAmounts : satsAmounts).map(a => (
                <Pill key={a} selected={a === amount} onClick={() => setAmount(a)}>
                  {isFiat ? `$${a.toLocaleString()}` : formatSats(a)}
                </Pill>
              ))}
            <Pill onClick={() => setCustomAmount(s => !s)} selected={customAmount}>
              <FormattedMessage defaultMessage="Custom" />
            </Pill>
          </div>
          {customAmount && <input type="number" value={amount} onChange={e => setAmount(e.target.valueAsNumber)} />}
        </div>
        {svc && (svc.maxCommentLength > 0 || svc.canZap) && (
          <div className="flex flex-col gap-2">
            <small>
              <FormattedMessage defaultMessage="Your comment for {name}" values={{ name }} />
            </small>
            <div>
              <textarea placeholder="Nice!" value={comment} onChange={e => setComment(e.target.value)} />
            </div>
          </div>
        )}
        <DefaultButton onClick={send}>
          <FormattedMessage defaultMessage="Zap!" />
        </DefaultButton>
      </>
    );
  }

  function payInvoice() {
    if (!invoice) return;

    const link = `lightning:${invoice}`;
    return (
      <>
        <QrCode data={link} link={link} className="mx-auto" />
        <div className="flex items-center justify-center">
          <Copy text={invoice} />
        </div>
        <DefaultButton onClick={() => onFinish()}>
          <FormattedMessage defaultMessage="Back" id="cyR7Kh" />
        </DefaultButton>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="flex gap-2 items-center">
        <FormattedMessage defaultMessage="Zap {name}" id="oHPB8Q" values={{ name }} />
        <Icon name="zap-filled" />
      </h3>
      {input()}
      {payInvoice()}
    </div>
  );
}

export function SendZapsDialog(props: Omit<SendZapsProps, "onFinish">) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  return (
    <Fragment>
      {props.button ? (
        <div onClick={() => setOpen(true)}>{props.button}</div>
      ) : (
        <PrimaryButton onClick={() => setOpen(true)}>
          <Icon name="zap-filled" size={16} />
          <FormattedMessage defaultMessage="Zap" />
        </PrimaryButton>
      )}
      {open && (
        <Modal id="send-zaps" onClose={() => setOpen(false)} ready={ready}>
          <SendZaps {...props} onFinish={() => setOpen(false)} onTargetReady={() => setReady(true)} />
        </Modal>
      )}
    </Fragment>
  );
}

export function ZapEvent({ ev, children }: { children: ReactNode; ev: TaggedNostrEvent }) {
  const host = getHost(ev);
  const profile = useUserProfile(host);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const target = profile?.lud16 ?? profile?.lud06;

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      {open && (
        <Modal id="send-zaps" onClose={() => setOpen(false)} ready={ready}>
          <SendZaps
            lnurl={target ?? ""}
            eTag={ev.id}
            pubkey={host}
            targetName={getName(host, profile)}
            onFinish={() => setOpen(false)}
            onTargetReady={() => setReady(true)}
          />
        </Modal>
      )}
    </>
  );
}
