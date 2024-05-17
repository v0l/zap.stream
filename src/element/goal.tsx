import { useMemo } from "react";
import Confetti from "react-confetti";
import { FormattedMessage } from "react-intl";

import { type NostrEvent, NostrLink } from "@snort/system";
import { useUserProfile } from "@snort/system-react";

import { findTag } from "@/utils";
import { formatSats } from "@/number";
import usePreviousValue from "@/hooks/usePreviousValue";
import { SendZapsDialog } from "./send-zap";
import { getName } from "./profile";
import { useZaps } from "@/hooks/zaps";

export function Goal({ ev, confetti }: { ev: NostrEvent; confetti?: boolean }) {
  const profile = useUserProfile(ev.pubkey);
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const link = NostrLink.fromEvent(ev);
  const zaps = useZaps(link, true);
  const goalAmount = useMemo(() => {
    const amount = findTag(ev, "amount");
    return amount ? Number(amount) / 1000 : null;
  }, [ev]);

  if (!goalAmount) {
    return null;
  }

  const soFar = useMemo(() => {
    return zaps
      .filter(z => z.receiver === ev.pubkey && z.targetEvents.some(a => a.matchesEvent(ev)))
      .reduce((acc, z) => acc + z.amount, 0);
  }, [zaps]);

  const progress = Math.max(0, Math.min(100, (soFar / goalAmount) * 100));
  const isFinished = progress >= 100;
  const previousValue = usePreviousValue(isFinished);

  const goalContent = (
    <div className="flex flex-col cursor-pointer">
      {ev.content.length > 0 && <p>{ev.content}</p>}
      <div className="relative h-10">
        <div className="absolute bg-layer-2 h-3 rounded-full my-4 w-full"></div>
        <div
          className="absolute bg-zap h-3 rounded-full text-xs font-medium my-4 leading-3 pl-1"
          style={{
            width: `${progress}%`,
          }}>
          {soFar > 0 ? formatSats(soFar) : ""}
        </div>
        <div className="absolute text-right text-xs right-1 font-medium my-4 leading-3">
          <FormattedMessage defaultMessage="Goal: {amount}" id="QceMQZ" values={{ amount: formatSats(goalAmount) }} />
        </div>
      </div>
      {isFinished && previousValue === false && (confetti ?? true) && (
        <Confetti numberOfPieces={2100} recycle={false} />
      )}
    </div>
  );

  return zapTarget ? (
    <SendZapsDialog
      lnurl={zapTarget}
      pubkey={ev.pubkey}
      eTag={ev?.id}
      targetName={getName(ev.pubkey, profile)}
      button={goalContent}
    />
  ) : (
    goalContent
  );
}
