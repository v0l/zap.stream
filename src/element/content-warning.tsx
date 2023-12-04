import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";

export function isContentWarningAccepted() {
  return Boolean(window.localStorage.getItem("accepted-content-warning"));
}

export function ContentWarningOverlay() {
  const navigate = useNavigate();
  const [is18Plus, setIs18Plus] = useState(isContentWarningAccepted());
  if (is18Plus) return null;

  function grownUp() {
    window.localStorage.setItem("accepted-content-warning", "true");
    setIs18Plus(true);
  }

  return (
    <div className="fullscreen-exclusive age-check">
      <h1>
        <FormattedMessage defaultMessage="Sexually explicit material ahead!" id="rWBFZA" />
      </h1>
      <h2>
        <FormattedMessage defaultMessage="Confirm your age" id="s7V+5p" />
      </h2>
      <div className="flex gap-3">
        <button className="btn btn-warning" onClick={grownUp}>
          <FormattedMessage defaultMessage="Yes, I am over 18" id="O2Cy6m" />
        </button>
        <button className="btn" onClick={() => navigate("/")}>
          <FormattedMessage defaultMessage="No, I am under 18" id="KkIL3s" />
        </button>
      </div>
    </div>
  );
}
