import "./goal.css";
import { useMemo } from "react";
import * as Progress from "@radix-ui/react-progress";
import Confetti from "react-confetti";

import { type NostrEvent } from "@snort/system";
import { useUserProfile } from "@snort/system-react";

import { findTag } from "utils";
import { formatSats } from "number";
import usePreviousValue from "hooks/usePreviousValue";
import { SendZapsDialog } from "element/send-zap";
import { useZaps } from "hooks/goals";
import { getName } from "element/profile";
import { Icon } from "./icon";
import { FormattedMessage } from "react-intl";

export function Goal({ ev }: { ev: NostrEvent }) {
  const profile = useUserProfile(ev.pubkey);
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const zaps = useZaps(ev, true);
  const goalAmount = useMemo(() => {
    const amount = findTag(ev, "amount");
    return amount ? Number(amount) / 1000 : null;
  }, [ev]);

  if (!goalAmount) {
    return null;
  }

  const soFar = useMemo(() => {
    return zaps.filter(z => z.receiver === ev.pubkey && z.event === ev.id).reduce((acc, z) => acc + z.amount, 0);
  }, [zaps]);

  const progress = Math.max(0, Math.min(100, (soFar / goalAmount) * 100));
  const isFinished = progress >= 100;
  const previousValue = usePreviousValue(isFinished);

  const goalContent = (
    <div className="goal" style={{ cursor: zapTarget ? "pointer" : "auto" }}>
      {ev.content.length > 0 && <p>{ev.content}</p>}
      <div className={`progress-container ${isFinished ? "finished" : ""}`}>
        <Progress.Root className="progress-root" value={progress}>
          <Progress.Indicator className="progress-indicator" style={{ transform: `translateX(-${100 - progress}%)` }}>
            {!isFinished && <span className="amount so-far">{formatSats(soFar)}</span>}
          </Progress.Indicator>
          <span className="amount target">
            <FormattedMessage defaultMessage="Goal: {amount}" values={{ amount: formatSats(goalAmount) }} />
          </span>
        </Progress.Root>
        <div className="zap-circle">
          <Icon name="zap-filled" className={isFinished ? "goal-finished" : "goal-unfinished"} />
        </div>
      </div>
      {isFinished && previousValue === false && <Confetti numberOfPieces={2100} recycle={false} />}
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
