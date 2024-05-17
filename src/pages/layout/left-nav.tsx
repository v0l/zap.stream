import { useContext } from "react";
import { LayoutContext } from "./context";
import { NavLinkIcon } from "./nav-icon";
import { FormattedMessage } from "react-intl";

export function LeftNav() {
  const layout = useContext(LayoutContext);

  return (
    <div className="flex flex-col gap-4 p-2 max-xl:hidden">
      <NavLinkIcon name="signal" route="/streams" className="flex gap-2 items-center">
        {layout.leftNav && (
          <span className="pr-3">
            <FormattedMessage defaultMessage="Streams" />
          </span>
        )}
      </NavLinkIcon>
      <NavLinkIcon name="play-circle" route="/videos" className="flex gap-2 items-center">
        {layout.leftNav && (
          <span className="pr-3">
            <FormattedMessage defaultMessage="Videos" />
          </span>
        )}
      </NavLinkIcon>
      <NavLinkIcon name="grid" route="/category" className="flex gap-2 items-center">
        {layout.leftNav && (
          <span className="pr-3">
            <FormattedMessage defaultMessage="Categories" />
          </span>
        )}
      </NavLinkIcon>
    </div>
  );
}
