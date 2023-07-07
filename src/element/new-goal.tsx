import "./new-goal.css";
import * as Dialog from "@radix-ui/react-dialog";

import AsyncButton from "./async-button";
import { NostrLink, EventPublisher } from "@snort/system";
import { unixNow } from "@snort/shared";
import { Icon } from "element/icon";
import { useEffect, useState } from "react";
import { eventLink } from "utils";
import { NostrProviderDialog } from "./nostr-provider-dialog";
import { System } from "index";
import { GOAL } from "const";

interface NewGoalDialogProps {
  link: NostrLink;
}

export function NewGoalDialog({ link }: NewGoalDialogProps) {
  const [open, setOpen] = useState(false);

  const [goalAmount, setGoalAmount] = useState("");
  const [goalName, setGoalName] = useState("");

  async function publishGoal() {
    const pub = await EventPublisher.nip7();
    if (pub) {
      const evNew = await pub.generic((eb) => {
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
            <span>Add stream goal</span>
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="new-goal">
            <div className="zap-goals">
              <Icon
                name="zap-filled"
                className="stream-zap-goals-icon"
                size={16}
              />
              <h3>Stream Zap Goals</h3>
            </div>
            <div>
              <p>Name</p>
              <div className="paper">
                <input
                  type="text"
                  value={goalName}
                  placeholder="e.g. New Laptop"
                  onChange={(e) => setGoalName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <p>Amount</p>
              <div className="paper">
                <input
                  type="number"
                  placeholder="21"
                  min="1"
                  max="2100000000000000"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="create-goal">
              <AsyncButton
                type="button"
                className="btn btn-primary wide"
                disabled={!isValid}
                onClick={publishGoal}
              >
                Create goal
              </AsyncButton>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
