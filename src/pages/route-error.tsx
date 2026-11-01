import { useEffect } from "react"
import { FormattedMessage } from "react-intl"
import { isRouteErrorResponse, useRouteError } from "react-router"

/**
 * Route errorElement (root + all child routes): renders when a route component
 * or loader throws, instead of react-router's default error page. A reload
 * button gives a reset path for transient failures (e.g. one malformed event
 * in a live query) so the app doesn't stay stuck on this page.
 */
export function RouteError() {
  const error = useRouteError()
  useEffect(() => {
    console.error("Route error:", error)
  }, [error])
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <h3>
        <FormattedMessage defaultMessage="Something went wrong" />
      </h3>
      <small>{isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : String(error)}</small>
      <button type="button" className="primary" onClick={() => window.location.reload()}>
        <FormattedMessage defaultMessage="Reload" />
      </button>
    </div>
  )
}
