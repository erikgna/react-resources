import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Class component because error boundaries require componentDidCatch,
// which has no hooks equivalent in React yet.
export class RemoteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      // Shown when the remote is unreachable or the module throws on load
      return <div>Remote failed to load.</div>
    }
    return this.props.children
  }
}
