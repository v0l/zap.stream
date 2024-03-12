import { useIntl } from "react-intl";
import { useGoals } from "@/hooks/goals";
import { useLogin } from "@/hooks/login";

interface GoalSelectorProps {
  goal?: string;
  onGoalSelect: (g: string) => void;
}

export function GoalSelector({ goal, onGoalSelect }: GoalSelectorProps) {
  const login = useLogin();
  const goals = useGoals(login?.pubkey, true);
  const { formatMessage } = useIntl();
  return (
    <select value={goal} onChange={ev => onGoalSelect(ev.target.value)}>
      <option value={""}>{formatMessage({ defaultMessage: "New Goal" })}</option>
      {goals?.map(x => (
        <option key={x.id} value={x.id}>
          {x.content}
        </option>
      ))}
    </select>
  );
}
