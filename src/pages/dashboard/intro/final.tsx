import { FormattedMessage } from "react-intl";
import StepHeader from "./step-header";
import { DefaultButton } from "@/element/buttons";
import { useStreamProvider } from "@/hooks/stream-provider";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StreamKey from "@/element/provider/nostr/stream-key";
import { ExternalLink } from "@/element/external-link";
import { AccountResponse } from "@/providers";

export default function DashboardIntroFinal() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<AccountResponse>();
  const { provider: streamProvider } = useStreamProvider();

  const defaultEndpoint = useMemo(() => {
    return info?.endpoints.find(a => a.name == "Best") ?? info?.endpoints[0];
  }, [info]);

  async function loadInfo() {
    streamProvider.info().then(i => {
      setInfo(i);
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
          <FormattedMessage defaultMessage="Configure your streaming software" />
        </h2>
        <p className="text-center text-layer-5">
          <FormattedMessage
            defaultMessage="To go live, copy and paste your Server URL and Stream Key below into your streaming software settings and press 'Start Streaming'. We recommend <a>OBS</a>."
            values={{
              a: c => <ExternalLink href="https://obsproject.com/">{c}</ExternalLink>,
            }}
          />
        </p>
        {defaultEndpoint && <StreamKey ep={defaultEndpoint} />}
        <DefaultButton
          onClick={async () => {
            navigate("/dashboard?setupComplete=true");
          }}>
          <FormattedMessage defaultMessage="Go to Dashboard" />
        </DefaultButton>
      </div>
    </div>
  );
}
