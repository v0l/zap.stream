import { Component, type ReactNode } from "react"

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
            <h3>Something went wrong</h3>
            <small>{this.state.error.message}</small>
          </div>
        )
      )
    }
    return this.props.children
  }
}
