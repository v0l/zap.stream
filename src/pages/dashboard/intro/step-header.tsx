import classNames from "classnames"
import { FormattedMessage } from "react-intl"
import { Link, useLocation } from "react-router"

const Steps = [
  { path: "/dashboard/step-1", name: <FormattedMessage defaultMessage="Info" /> },
  { path: "/dashboard/step-2", name: <FormattedMessage defaultMessage="Category" /> },
  { path: "/dashboard/step-3", name: <FormattedMessage defaultMessage="Forwarding" /> },
  { path: "/dashboard/step-4", name: <FormattedMessage defaultMessage="Goal" /> },
]

export default function StepHeader() {
  const location = useLocation()
  const onStep = Number(location.pathname.split("/").slice(-1)[0].split("-")[1])

  return (
    <ol className="grid grid-cols-4 gap-2 w-full mb-10">
      {Steps.map((s, i) => {
        const n = i + 1
        return (
          <li key={s.path}>
            <Link
              to={s.path}
              aria-current={onStep === n ? "step" : undefined}
              className={classNames(
                "flex flex-col gap-2 text-sm font-semibold",
                onStep >= n ? "text-text" : "text-layer-4",
              )}
            >
              <span className={classNames("h-1 rounded-full", onStep >= n ? "bg-primary" : "bg-layer-3")} />
              {s.name}
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
