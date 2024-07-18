import { FormattedMessage, useIntl } from "react-intl";
import StepHeader from "./step-header";
import { DefaultButton } from "@/element/buttons";
import { DefaultProvider } from "@/providers";
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoalSelector } from "@/element/stream-editor/goal-selector";
import AmountInput from "@/element/amount-input";
import { useLogin } from "@/hooks/login";
import { GOAL, defaultRelays } from "@/const";
import { SnortContext } from "@snort/system-react";

export default function DashboardIntroStep4() {
  const navigate = useNavigate();
  const location = useLocation();
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalMount] = useState(0);
  const [goal, setGoal] = useState<string>();
  const { formatMessage } = useIntl();
  const login = useLogin();
  const system = useContext(SnortContext);

  async function loadInfo() {
    DefaultProvider.info().then(i => {
      setGoal(i.streamInfo?.goal);
    });
  }

  useEffect(() => {
    loadInfo();
  }, []);

  return (
    <div className="mx-auto flex flex-col items-center md:w-[30rem] max-md:w-full max-md:px-3">
      <StepHeader />
      <div className="flex flex-col gap-4 w-full">
        <h2 className="text-center">
          <FormattedMessage defaultMessage="Stream Goal (optional)" />
        </h2>
        <p className="text-center text-layer-5">
          <FormattedMessage defaultMessage="Stream goals encourage viewers to support streamers via donations." />
          <FormattedMessage defaultMessage="Leave blank if you do not wish to set up any goals." />
        </p>

        <GoalSelector goal={goal} onGoalSelect={setGoal} />
        {!goal && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={formatMessage({
                defaultMessage: "Goal Name",
              })}
              value={goalName}
              onChange={e => setGoalName(e.target.value)}
            />
            <AmountInput onChange={setGoalMount} />
          </div>
        )}
        <DefaultButton
          onClick={async () => {
            const pub = login?.publisher();
            if (!goal && pub && goalName && goalAmount) {
              const goalEvent = await pub.generic(eb => {
                return eb
                  .kind(GOAL)
                  .tag(["amount", String(goalAmount * 1000)])
                  .tag(["relays", ...Object.keys(defaultRelays)])
                  .content(goalName);
              });
              await system.BroadcastEvent(goalEvent);
              const newState = {
                ...location.state,
                goal: goalEvent.id,
              };
              await DefaultProvider.updateStream(newState);
              navigate("/dashboard/final", {
                state: newState,
              });
            } else if (goal) {
              const newState = {
                ...location.state,
                goal,
              };
              await DefaultProvider.updateStream(newState);
              navigate("/dashboard/final", {
                state: newState,
              });
            } else {
              navigate("/dashboard/final", {
                state: location.state,
              });
            }
          }}>
          <FormattedMessage defaultMessage="Continue" />
        </DefaultButton>
      </div>
    </div>
  );
}
