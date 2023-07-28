import * as BaseToggle from "@radix-ui/react-toggle";
import "./toggle.css";

interface ToggleProps {
  label: string;
}

function ToggleLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 5C4.13401 5 1 8.13401 1 12C1 15.866 4.13401 19 8 19H16C19.866 19 23 15.866 23 12C23 8.13401 19.866 5 16 5H8ZM12 12C12 14.2091 10.2091 16 8 16C5.79086 16 4 14.2091 4 12C4 9.79086 5.79086 8 8 8C10.2091 8 12 9.79086 12 12Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ToggleRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 5C19.866 5 23 8.13401 23 12C23 15.866 19.866 19 16 19H8C4.13401 19 1 15.866 1 12C1 8.13401 4.13401 5 8 5H16ZM12 12C12 14.2091 13.7909 16 16 16C18.2091 16 20 14.2091 20 12C20 9.79086 18.2091 8 16 8C13.7909 8 12 9.79086 12 12Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Toggle({ label, text, ...rest }: ToggleProps) {
  const { pressed } = rest;
  return (
    <div className="toggle-container">
      <BaseToggle.Root className="toggle" aria-label={label} {...rest}>
        {pressed ? <ToggleRight /> : <ToggleLeft />}
      </BaseToggle.Root>
      <span className="toggle-text">{text}</span>
    </div>
  );
}
