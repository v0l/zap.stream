import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";

import { Layer1Button, WarningButton } from "@/element/buttons";
import Logo from "@/element/logo";
import { NSFWStore } from "./store";
import { useContentWarning } from "./hook.tsx";

export function ContentWarningOverlay() {
  const navigate = useNavigate();
  const is18Plus = useContentWarning();
  if (is18Plus) return null;

  function grownUp() {
    NSFWStore.setValue(true);
  }

  return (
    <div className="z-10 bg-layer-0 w-screen h-screen absolute top-0 left-0 flex flex-col gap-4 justify-center items-center">
      <Logo width={50} />
      <h1>
        <FormattedMessage defaultMessage="Sexually explicit material ahead!" />
      </h1>
      <h2>
        <FormattedMessage defaultMessage="Confirm your age" />
      </h2>
      <div className="flex gap-3">
        <WarningButton onClick={grownUp}>
          <FormattedMessage defaultMessage="Yes, I am over 18" />
        </WarningButton>
        <Layer1Button onClick={() => navigate("/")}>
          <FormattedMessage defaultMessage="No, I am under 18" />
        </Layer1Button>
      </div>
    </div>
  );
}

export { useContentWarning };
