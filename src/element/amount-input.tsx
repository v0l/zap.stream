import { useRates } from "@/hooks/rates";
import { useCallback, useEffect, useState } from "react";

export default function AmountInput({ onChange }: { onChange: (n: number) => void }) {
  const [type, setType] = useState<"sats" | "usd">("sats");
  const [value, setValue] = useState(0);
  const rates = useRates("BTCUSD");

  const satsValue = useCallback(
    () => (type === "usd" ? Math.round(value * 1e-6 * rates.ask) / 100 : value),
    [value, type],
  );

  useEffect(() => {
    onChange(satsValue());
  }, [satsValue]);

  return (
    <div className="flex bg-layer-2 rounded-xl">
      <input
        type="number"
        className="!pr-0 !pl-4"
        value={value}
        onChange={e => {
          setValue(e.target.valueAsNumber);
        }}
      />
      <select
        value={type}
        className="px-1 text-center w-fit"
        onChange={e => {
          if (type === "sats" && e.target.value === "usd") {
            setValue(Math.round(value * 1e-6 * rates.ask) / 100);
          } else if (type === "usd" && e.target.value === "sats") {
            setValue(Math.round((value / rates.ask) * 1e8));
          }
          setType(e.target.value as "sats" | "usd");
        }}>
        <option value="sats">SATS</option>
        <option value="usd">USD</option>
      </select>
    </div>
  );
}
