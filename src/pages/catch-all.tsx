import { Helmet } from "@dr.pogodin/react-helmet"
import { setStatus } from "@/ssr/state"

export function CatchAllRoutePage() {
  setStatus(404)
  return (
    <>
      <Helmet>
        <title>Not found - zap.stream</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <b className="error">Not found :(</b>
    </>
  )
}
