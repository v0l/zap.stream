import classNames from "classnames"
import { FormattedMessage } from "react-intl"
import { Link, useLocation } from "react-router"
import { AllCategories } from "./all-categories"

export function CategoryTabs({ className }: { className?: string }) {
  const location = useLocation()
  const tabs = [
    { to: "/", name: <FormattedMessage defaultMessage="All live" /> },
    ...AllCategories.map(a => ({ to: `/category/${a.id}`, name: a.name })),
  ]
  const path = location.pathname.replace("/category/internal:", "/category/")
  return (
    <nav className={classNames("flex gap-6 border-b border-layer-3 overflow-x-auto scrollbar-hidden", className)}>
      {tabs.map(t => {
        const active = path === t.to || (t.to === "/" && path === "/streams")
        return (
          <Link
            key={t.to}
            to={t.to}
            aria-current={active ? "page" : undefined}
            className={classNames(
              "pb-3 -mb-px whitespace-nowrap font-medium border-b-2",
              active ? "text-text border-primary" : "text-layer-4 border-transparent hover:text-text",
            )}
          >
            {t.name}
          </Link>
        )
      })}
    </nav>
  )
}
