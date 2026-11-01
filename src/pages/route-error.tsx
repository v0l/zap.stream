import { isRouteErrorResponse, useRouteError } from "react-router"

/**
 * Root-route errorElement: renders when a route component or loader throws,
 * instead of react-router's default error page. A reload button gives a reset
 * path for transient failures (e.g. one malformed event in a live query) so
 * the app doesn't stay stuck on this page until the user thinks of it.
 */
export function RouteError() {
  const error = useRouteError()
  console.error("Route error:", error)
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <h3>Something went wrong</h3>
      <small>{isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : String(error)}</small>
      <button type="button" className="primary" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  )
}
