import { Helmet } from "@dr.pogodin/react-helmet"
import { FormattedMessage } from "react-intl"
import { Link } from "react-router"
import { setStatus } from "@/ssr/state"

export function CatchAllRoutePage() {
  setStatus(404)
  return (
    <>
      <Helmet>
        <title>Not found - zap.stream</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="flex flex-col items-start gap-3 p-4 sm:px-8 sm:py-16 max-w-[560px]">
        <span className="font-display text-6xl font-extrabold text-primary">404</span>
        <h1>
          <FormattedMessage defaultMessage="Nothing here" />
        </h1>
        <p className="text-layer-4">
          <FormattedMessage defaultMessage="This page does not exist, or the stream it pointed to has gone." />
        </p>
        <Link to="/" className="mt-2 rounded-full bg-primary px-5 py-2.5 font-semibold leading-none">
          <FormattedMessage defaultMessage="Back to streams" />
        </Link>
      </div>
    </>
  )
}
