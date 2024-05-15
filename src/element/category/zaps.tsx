import { useCategoryZaps } from "@/hooks/category-zaps";
import Pill from "../pill";
import { Icon } from "../icon";
import { formatSatsCompact } from "@/number";

export function CategoryZaps({ gameId }: { gameId: string }) {
  const zaps = useCategoryZaps(gameId);

  const total = zaps.reduce((acc, v) => (acc += v.amount), 0);

  return (
    <Pill className="flex gap-2">
      <Icon name="zap-filled" />
      {formatSatsCompact(total)}
    </Pill>
  );
}
