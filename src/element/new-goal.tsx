import "./new-goal.css";
import * as Dialog from "@radix-ui/react-dialog";

import AsyncButton from "./async-button";
import { NostrLink } from "@snort/system";
import { Icon } from "element/icon";
import { useState } from "react";
import { System } from "index";
import { GOAL } from "const";
import { useLogin } from "hooks/login";
import { FormattedMessage } from "react-intl";

interface NewGoalDialogProps {
  link: NostrLink;
}

export function NewGoalDialog({ link }: NewGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const login = useLogin();

  const [goalAmount, setGoalAmount] = useState("");
  const [goalName, setGoalName] = useState("");

  async function publishGoal() {
    const pub = login?.publisher();
    if (pub) {
      const evNew = await pub.generic(eb => {
        eb.kind(GOAL)
          .tag(["a", `${link.kind}:${link.author}:${link.id}`])
          .tag(["amount", String(Number(goalAmount) * 1000)])
          .content(goalName);
        if (link.relays?.length) {
          eb.tag(["relays", ...link.relays]);
        }
        return eb;
      });
      console.debug(evNew);
      System.BroadcastEvent(evNew);
      setOpen(false);
      setGoalName("");
      setGoalAmount("");
    }
  }
  const isValid = goalName.length && Number(goalAmount) > 0;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="btn btn-primary">
          <span>
            <Icon name="zap-filled" size={12} />
            <span>
              <FormattedMessage defaultMessage="Add stream goal" />
            </span>
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="new-goal">
            <div className="zap-goals">
              <Icon name="zap-filled" className="stream-zap-goals-icon" size={16} />
              <h3>
                <FormattedMessage defaultMessage="Stream Zap Goals" />
              </h3>
            </div>
            <div>
              <p>
                <FormattedMessage defaultMessage="Name" />
              </p>
              <div className="paper">
                <input
                  type="text"
                  value={goalName}
                  placeholder="e.g. New Laptop"
                  onChange={e => setGoalName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <p>
                <FormattedMessage defaultMessage="Amount" />
              </p>
              <div className="paper">
                <input
                  type="number"
                  placeholder="21"
                  min="1"
                  max="2100000000000000"
                  value={goalAmount}
                  onChange={e => setGoalAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="create-goal">
              <AsyncButton type="button" className="btn btn-primary wide" disabled={!isValid} onClick={publishGoal}>
                <FormattedMessage defaultMessage="Create Goal" />
              </AsyncButton>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
