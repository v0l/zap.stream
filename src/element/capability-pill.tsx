import Pill from "./pill";

interface CapabilityPillProps {
  capability: string;
  selected?: boolean;
  onClick?: () => void;
}

function parseCapability(cap: string): string {
  const [tag, ...others] = cap.split(":");
  if (tag === "variant") {
    const [height] = others;
    return height === "source" ? "source" : `${height.includes("h") ? height.slice(0, -1) : height}p`;
  }
  if (tag === "output") {
    return others[0];
  }
  return cap;
}

export default function CapabilityPill({ capability, selected, onClick }: CapabilityPillProps) {
  return (
    <Pill selected={selected} onClick={onClick}>
      {parseCapability(capability)}
    </Pill>
  );
}

export { parseCapability };
