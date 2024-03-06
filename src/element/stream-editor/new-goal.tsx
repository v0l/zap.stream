import { FormattedMessage } from "react-intl";
import { useContext, useState } from "react";
import { SnortContext } from "@snort/system-react";

import { Icon } from "../icon";
import { GOAL } from "@/const";
import { useLogin } from "@/hooks/login";
import { defaultRelays } from "@/const";
import { DefaultButton } from "../buttons";
import Modal from "../modal";

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
    <>
      <DefaultButton onClick={() => setOpen(true)}>
        <Icon name="zap-filled" size={12} />
        <span>
          <FormattedMessage defaultMessage="New Goal" />
        </span>
      </DefaultButton>
      {open && (
        <Modal id="new-goal" onClose={() => setOpen(false)}>
          <div className="new-goal content-inner">
            <div className="zap-goals">
              <Icon name="zap-filled" className="stream-zap-goals-icon" size={16} />
              <h3>
                <FormattedMessage defaultMessage="Stream Zap Goals" id="0GfNiL" />
              </h3>
            </div>
            <div>
              <p>
                <FormattedMessage defaultMessage="Name" id="HAlOn1" />
              </p>
              <input
                type="text"
                value={goalName}
                placeholder="e.g. New Laptop"
                onChange={e => setGoalName(e.target.value)}
              />
            </div>
            <div>
              <p>
                <FormattedMessage defaultMessage="Amount" id="/0TOL5" />
              </p>
              <input
                type="number"
                placeholder="21"
                min="1"
                max="2100000000000000"
                value={goalAmount}
                onChange={e => setGoalAmount(e.target.value)}
              />
            </div>
            <div className="create-goal">
              <DefaultButton disabled={!isValid} onClick={publishGoal}>
                <FormattedMessage defaultMessage="Create Goal" id="X2PZ7D" />
              </DefaultButton>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
