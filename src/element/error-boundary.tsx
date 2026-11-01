import { Component, type ReactNode } from "react"
import { FormattedMessage } from "react-intl"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  error?: Error
}

/**
 * Catches render-time errors in its subtree so a single unparseable event
 * (exotic content, malformed fields) degrades to a fallback instead of
 * unmounting the whole app or an OBS overlay.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {}

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("Render error caught:", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            <h3>
              <FormattedMessage defaultMessage="Something went wrong" />
            </h3>
            <small>{this.state.error.message}</small>
            <button type="button" className="primary" onClick={() => window.location.reload()}>
              <FormattedMessage defaultMessage="Reload" />
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
