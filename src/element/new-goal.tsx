import "./new-goal.css";
import * as Dialog from "@radix-ui/react-dialog";

import AsyncButton from "./async-button";
import { Icon } from "element/icon";
import { useContext, useState } from "react";
import { GOAL } from "const";
import { useLogin } from "hooks/login";
import { FormattedMessage } from "react-intl";
import { defaultRelays } from "const";
import { SnortContext } from "@snort/system-react";

export function NewGoalDialog() {
  const system = useContext(SnortContext);
  const [open, setOpen] = useState(false);
  const login = useLogin();

  const [goalAmount, setGoalAmount] = useState("");
  const [goalName, setGoalName] = useState("");

  async function publishGoal() {
    const pub = login?.publisher();
    if (pub) {
      const evNew = await pub.generic(eb => {
        eb.kind(GOAL)
          .tag(["amount", String(Number(goalAmount) * 1000)])
          .tag(["relays", ...Object.keys(defaultRelays)])
          .content(goalName);
        return eb;
      });
      console.debug(evNew);
      await system.BroadcastEvent(evNew);
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
          <div className="new-goal content-inner">
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
