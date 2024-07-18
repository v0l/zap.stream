import { useLayout } from "./context";
import { NavLinkIcon } from "./nav-icon";
import { FormattedMessage } from "react-intl";
import { useMediaQuery } from "usehooks-ts";
import Flyout from "@/element/flyout";

export function LeftNav() {
  const layout = useLayout();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const expandLabels = !isDesktop || layout.leftNavExpand;

  function hideAfterMobileNav() {
    if (isDesktop) return;
    layout.update(c => {
      c.leftNavExpand = false;
      return { ...c };
    });
  }

  if (layout.leftNav === false) return;
  function navInner() {
    return (
      <div className="flex flex-col gap-4 p-2">
        <NavLinkIcon name="signal" route="/streams" className="flex gap-2 items-center" onClick={hideAfterMobileNav}>
          {expandLabels && (
            <span className="pr-3">
              <FormattedMessage defaultMessage="Streams" />
            </span>
          )}
        </NavLinkIcon>
        <NavLinkIcon
          name="play-circle"
          route="/videos"
          className="flex gap-2 items-center"
          onClick={hideAfterMobileNav}>
          {expandLabels && (
            <span className="pr-3">
              <FormattedMessage defaultMessage="Videos" />
            </span>
          )}
        </NavLinkIcon>
        <NavLinkIcon name="film" route="/shorts" className="flex gap-2 items-center" onClick={hideAfterMobileNav}>
          {expandLabels && (
            <span className="pr-3">
              <FormattedMessage defaultMessage="Shorts" />
            </span>
          )}
        </NavLinkIcon>
        <NavLinkIcon name="grid" route="/category" className="flex gap-2 items-center" onClick={hideAfterMobileNav}>
          {expandLabels && (
            <span className="pr-3">
              <FormattedMessage defaultMessage="Categories" />
            </span>
          )}
        </NavLinkIcon>
      </div>
    );
  }

  if (isDesktop) {
    return navInner();
  } else {
    return (
      <Flyout
        side="left"
        show={layout.leftNavExpand}
        onClose={() => {
          layout.update(c => {
            c.leftNavExpand = !c.leftNavExpand;
            return { ...c };
          });
        }}>
        {navInner()}
      </Flyout>
    );
  }
}
