import * as BaseToggle from "@radix-ui/react-toggle";
import "./toggle.css";
import { Icon } from "./icon";

interface ToggleProps {
  label: string;
  text: string;
  pressed?: boolean;
  onPressedChange?: (b: boolean) => void;
}

export function Toggle({ label, text, ...rest }: ToggleProps) {
  const { pressed } = rest;
  return (
    <div className="toggle-container">
      <BaseToggle.Root className="toggle" aria-label={label} {...rest}>
        {pressed ? <Icon name="toggle-on" /> : <Icon name="toggle-off" />}
      </BaseToggle.Root>
      <span className="toggle-text">{text}</span>
    </div>
  );
}
