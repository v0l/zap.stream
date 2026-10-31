import classNames from "classnames"
import { FormattedMessage } from "react-intl"
import { NavLink, Outlet } from "react-router"

const Tabs = [
  {
    name: <FormattedMessage defaultMessage="Account" />,
    path: "",
  },
  {
    name: <FormattedMessage defaultMessage="Profile" />,
    path: "profile",
  },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 w-full max-w-[760px]">
      <h1 className="text-[clamp(24px,2.6vw,34px)] leading-tight">
        <FormattedMessage defaultMessage="Settings" />
      </h1>
      <nav className="flex gap-1 border-b border-layer-3">
        {Tabs.map(t => (
          <NavLink
            key={t.path}
            to={t.path}
            end={true}
            className={({ isActive }) =>
              classNames(
                "px-3 pb-2.5 pt-1 text-sm font-semibold border-b-2 -mb-px",
                isActive ? "border-primary text-text" : "border-transparent text-layer-4 hover:text-text",
              )
            }
          >
            {t.name}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
