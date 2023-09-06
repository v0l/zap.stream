import "./send-zap.css";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState, type ReactNode } from "react";
import { LNURL } from "@snort/shared";
import { NostrEvent, EventPublisher } from "@snort/system";
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "@noble/curves/abstract/utils";

import { formatSats } from "../number";
import { Icon } from "./icon";
import AsyncButton from "./async-button";
import QrCode from "./qr-code";
import { useLogin } from "hooks/login";
import Copy from "./copy";
import { defaultRelays } from "const";
import { FormattedMessage } from "react-intl";

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
  button?: ReactNode;
}

export function SendZaps({ lnurl, pubkey, aTag, eTag, targetName, onFinish }: SendZapsProps) {
  const UsdRate = 28_000;

  const satsAmounts = [
    21, 69, 121, 221, 420, 1_000, 2_100, 5_000, 6_666, 10_000, 21_000, 42_000, 69_000, 100_000, 210_000, 500_000,
    1_000_000,
  ];
  const usdAmounts = [0.05, 0.5, 2, 5, 10, 50, 100, 200];
  const [isFiat, setIsFiat] = useState(false);
  const [svc, setSvc] = useState<LNURLLike>();
  const [amount, setAmount] = useState(satsAmounts[0]);
  const [comment, setComment] = useState("");
  const [invoice, setInvoice] = useState("");
  const login = useLogin();
  const relays = Object.keys(defaultRelays);
  const name = targetName ?? svc?.name;
  async function loadService(lnurl: string) {
    const s = new LNURL(lnurl);
    await s.load();
    setSvc(s);
  }

  useEffect(() => {
    if (!svc) {
      if (typeof lnurl === "string") {
        loadService(lnurl).catch(console.warn);
      } else {
        setSvc(lnurl);
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

    const amountInSats = isFiat ? Math.floor((amount / UsdRate) * 1e8) : amount;
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

    if (window.webln) {
      await window.webln.enable();
      try {
        await window.webln.sendPayment(invoice.pr);
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
        <div className="flex g12">
          <span
            className={`pill${isFiat ? "" : " active"}`}
            onClick={() => {
              setIsFiat(false);
              setAmount(satsAmounts[0]);
            }}>
            SATS
          </span>
          <span
            className={`pill${isFiat ? " active" : ""}`}
            onClick={() => {
              setIsFiat(true);
              setAmount(usdAmounts[0]);
            }}>
            USD
          </span>
        </div>
        <div>
          <small>
            <FormattedMessage defaultMessage="Zap amount in {currency}" values={{ currency: isFiat ? "USD" : "SATS" }} />
          </small>
          <div className="amounts">
            {(isFiat ? usdAmounts : satsAmounts).map(a => (
              <span key={a} className={`pill${a === amount ? " active" : ""}`} onClick={() => setAmount(a)}>
                {isFiat ? `$${a.toLocaleString()}` : formatSats(a)}
              </span>
            ))}
          </div>
        </div>
        {svc && (svc.maxCommentLength > 0 || svc.canZap) && (
          <div>
            <small>
              <FormattedMessage defaultMessage="Your comment for {name}" values={{ name }} />
            </small>
            <div className="paper">
              <textarea placeholder="Nice!" value={comment} onChange={e => setComment(e.target.value)} />
            </div>
          </div>
        )}
        <div>
          <AsyncButton onClick={send} className="btn btn-primary">
            <FormattedMessage defaultMessage="Zap!" />
          </AsyncButton>
        </div>
      </>
    );
  }

  function payInvoice() {
    if (!invoice) return;

    const link = `lightning:${invoice}`;
    return (
      <>
        <QrCode data={link} link={link} />
        <div className="flex f-center">
          <Copy text={invoice} />
        </div>
        <button className="btn btn-primary wide" onClick={() => onFinish()}>
          <FormattedMessage defaultMessage="Back" />
        </button>
      </>
    );
  }

  return (
    <div className="send-zap">
      <h3>
        <FormattedMessage defaultMessage="Zap {name}" values={{ name }} />
        <Icon name="zap" />
      </h3>
      {input()}
      {payInvoice()}
    </div>
  );
}

export function SendZapsDialog(props: Omit<SendZapsProps, "onFinish">) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        {props.button ? (
          props.button
        ) : (
          <button className="btn btn-primary zap">
            <span className="hide-on-mobile">
              <FormattedMessage defaultMessage="Zap" />
            </span>
            <Icon name="zap-filled" size={16} />
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="content-inner">
            <SendZaps {...props} onFinish={() => setIsOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
