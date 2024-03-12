import { StreamProviderEndpoint } from "@/providers";
import { FormattedMessage, FormattedNumber } from "react-intl";

export default function BalanceTimeEstimate({
  balance,
  endpoint,
}: {
  balance: number;
  endpoint: StreamProviderEndpoint;
}) {
  const rate = (endpoint.unit === "min" ? (endpoint.rate ?? 0) * 60 : endpoint.rate) ?? 0;

  return (
    <FormattedMessage
      defaultMessage="{n} hours"
      values={{
        n: <FormattedNumber value={balance / rate} maximumFractionDigits={1} />,
      }}
    />
  );
}
