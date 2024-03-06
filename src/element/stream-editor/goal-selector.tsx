import { useIntl } from "react-intl";
import { useGoals } from "@/hooks/goals";

interface GoalSelectorProps {
  goal?: string;
  pubkey: string;
  onGoalSelect: (g: string) => void;
}

export function GoalSelector({ goal, pubkey, onGoalSelect }: GoalSelectorProps) {
  const goals = useGoals(pubkey, true);
  const { formatMessage } = useIntl();
  return (
    <select value={goal} onChange={ev => onGoalSelect(ev.target.value)}>
      <option>{formatMessage({ defaultMessage: "Select a goal..." })}</option>
      {goals?.map(x => (
        <option key={x.id} value={x.id}>
          {x.content}
        </option>
      ))}
    </select>
  );
}
