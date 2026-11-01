import { isRouteErrorResponse, useRouteError } from "react-router"

/**
 * Root-route errorElement: renders when a route component or loader throws,
 * instead of react-router's default error page. Also keeps the error visible
 * in the console for debugging.
 */
export function RouteError() {
  const error = useRouteError()
  console.error("Route error:", error)
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <h3>Something went wrong</h3>
      <small>{isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : String(error)}</small>
    </div>
  )
}
