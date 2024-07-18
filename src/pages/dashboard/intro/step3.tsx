import { FormattedMessage } from "react-intl";
import StepHeader from "./step-header";
import { DefaultButton } from "@/element/buttons";
import { DefaultProvider, StreamProviderForward } from "@/providers";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AddForwardInputs } from "@/element/provider/nostr/fowards";

export default function DashboardIntroStep3() {
  const navigate = useNavigate();
  const location = useLocation();
  const [forwards, setForwards] = useState<Array<StreamProviderForward>>([]);

  async function loadInfo() {
    DefaultProvider.info().then(i => {
      setForwards(i.forwards ?? []);
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
          <FormattedMessage defaultMessage="Stream Forwarding (optional)" />
        </h2>
        <p className="text-center text-layer-5">
          <FormattedMessage defaultMessage="This allows you to forward your stream to other platforms to reach a wider audience." />
          <br />
          <FormattedMessage defaultMessage="To get started, grab your stream key from the platform you wish to forward to." />
        </p>

        <div className="grid grid-cols-2 gap-2">
          {forwards?.map(a => (
            <>
              <div className="bg-layer-2 rounded-xl px-3 flex items-center">{a.name}</div>
              <DefaultButton
                onClick={async () => {
                  await DefaultProvider.removeForward(a.id);
                  await loadInfo();
                }}>
                <FormattedMessage defaultMessage="Remove" id="G/yZLu" />
              </DefaultButton>
            </>
          ))}
        </div>
        <AddForwardInputs provider={DefaultProvider} onAdd={loadInfo} />
        <DefaultButton
          onClick={async () => {
            navigate("/dashboard/step-4", {
              state: location.state,
            });
          }}>
          <FormattedMessage defaultMessage="Continue" />
        </DefaultButton>
      </div>
    </div>
  );
}
