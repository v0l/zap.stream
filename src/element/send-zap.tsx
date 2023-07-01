import "./send-zap.css";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState, type ReactNode } from "react";
import { LNURL } from "@snort/shared";
import { NostrEvent, EventPublisher } from "@snort/system";
import { formatSats } from "../number";
import { Icon } from "./icon";
import AsyncButton from "./async-button";
import { Relays } from "index";
import QrCode from "./qr-code";

interface SendZapsProps {
  lnurl: string;
  pubkey?: string;
  aTag?: string;
  targetName?: string;
  onFinish: () => void;
  button?: ReactNode;
}

function SendZaps({
  lnurl,
  pubkey,
  aTag,
  targetName,
  onFinish,
}: SendZapsProps) {
  const UsdRate = 30_000;

  const satsAmounts = [
    100, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000,
  ];
  const usdAmounts = [0.05, 0.5, 2, 5, 10, 50, 100, 200];
  const [isFiat, setIsFiat] = useState(false);
  const [svc, setSvc] = useState<LNURL>();
  const [amount, setAmount] = useState(satsAmounts[0]);
  const [comment, setComment] = useState("");
  const [invoice, setInvoice] = useState("");

  const name = targetName ?? svc?.name;
  async function loadService() {
    const s = new LNURL(lnurl);
    await s.load();
    setSvc(s);
  }

  useEffect(() => {
    if (!svc) {
      loadService().catch(console.warn);
    }
  }, [lnurl]);

  async function send() {
    if (!svc) return;
    const pub = await EventPublisher.nip7();
    if (!pub) return;

    const amountInSats = isFiat ? Math.floor((amount / UsdRate) * 1e8) : amount;
    let zap: NostrEvent | undefined;
    if (pubkey && aTag) {
      zap = await pub.zap(
        amountInSats * 1000,
        pubkey,
        Relays,
        undefined,
        comment,
        (eb) => {
          return eb.tag(["a", aTag]);
        }
      );
    }
    const invoice = await svc.getInvoice(amountInSats, comment, zap);
    if (!invoice.pr) return;

    if (window.webln) {
      await window.webln.enable();
      await window.webln.sendPayment(invoice.pr);
      onFinish();
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
            }}
          >
            SATS
          </span>
          <span
            className={`pill${isFiat ? " active" : ""}`}
            onClick={() => {
              setIsFiat(true);
              setAmount(usdAmounts[0]);
            }}
          >
            USD
          </span>
        </div>
        <div>
          <small>Zap amount in {isFiat ? "USD" : "sats"}</small>
          <div className="amounts">
            {(isFiat ? usdAmounts : satsAmounts).map((a) => (
              <span
                key={a}
                className={`pill${a === amount ? " active" : ""}`}
                onClick={() => setAmount(a)}
              >
                {isFiat ? `$${a.toLocaleString()}` : formatSats(a)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <small>Your comment for {name}</small>
          <div className="paper">
            <textarea
              placeholder="Nice!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        <div>
          <AsyncButton onClick={send} className="btn btn-primary">
            Zap!
          </AsyncButton>
        </div>
      </>
    );
  }

  function payInvoice() {
    if (!invoice) return;

    const link = `lightning:${invoice}`;
    return <QrCode data={link} link={link} />;
  }

  return (
    <div className="send-zap">
      <h3>
        Zap {name}
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
            <span className="hide-on-mobile">Zap</span>
            <Icon name="zap" size={16} />
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <SendZaps {...props} onFinish={() => setIsOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
