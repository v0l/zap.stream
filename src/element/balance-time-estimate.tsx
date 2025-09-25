import { IngestEndpoint } from "@/providers";
import { FormattedMessage, FormattedNumber } from "react-intl";

export default function BalanceTimeEstimate({ balance, endpoint }: { balance: number; endpoint: IngestEndpoint }) {
  const rate = (endpoint.cost.unit === "min" ? (endpoint.cost.rate ?? 0) * 60 : endpoint.cost.rate) ?? 0;

  return (
    <FormattedMessage
      defaultMessage="{n} hours"
      values={{
        n: <FormattedNumber value={balance / rate} maximumFractionDigits={1} />,
      }}
    />
  );
}
