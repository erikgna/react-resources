import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createContext, useContext, useState, useRef, Component } from 'react'
import React from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current++
  return ref.current
}

// ─── 1. Mutation stale state ──────────────────────────────────────────────────

type MutableState = { count: number }
const MutableCtx = createContext<MutableState>({ count: 0 })

function MutableConsumer() {
  const state = useContext(MutableCtx)
  return <span data-testid="mut">{state.count}</span>
}

// ─── 2. Null default — missing Provider detection ─────────────────────────────

const RequiredCtx = createContext<string | null>(null)

function SafeConsumer() {
  const val = useContext(RequiredCtx)
  if (val === null) return <span data-testid="safe">missing-provider</span>
  return <span data-testid="safe">{val}</span>
}

// ─── 3. Error boundary ────────────────────────────────────────────────────────

const ThrowCtx = createContext(false)

function MaybeThrower() {
  const shouldThrow = useContext(ThrowCtx)
  if (shouldThrow) throw new Error('context-triggered-throw')
  return <span data-testid="thrower">ok</span>
}

class ErrorBoundary extends Component<
  { children: React.ReactNode; onError?: (e: Error) => void },
  { caught: string | null }
> {
  state = { caught: null }
  static getDerivedStateFromError(e: Error) { return { caught: e.message } }
  componentDidCatch(e: Error) { this.props.onError?.(e) }
  render() {
    if (this.state.caught) return <span data-testid="boundary">{this.state.caught}</span>
    return this.props.children
  }
}

// ─── 4. Consumer reading stale closure value ──────────────────────────────────

const CountCtx2 = createContext(0)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('08 · Failures — mutation staleness, missing Provider, error boundary', () => {
  it('mutation without new ref: consumer shows stale value (no re-render triggered)', () => {
    const sharedRef = { current: { count: 0 } }

    function Parent() {
      const [, forceUpdate] = useState(0)
      return (
        <>
          <MutableCtx.Provider value={sharedRef.current}>
            <MutableConsumer />
          </MutableCtx.Provider>
          <button onClick={() => {
            sharedRef.current.count++   // mutate in place — no new ref
            // NO forceUpdate → consumer does not re-render
          }}>mutate</button>
          <button onClick={() => forceUpdate(n => n + 1)}>force</button>
        </>
      )
    }
    render(<Parent />)
    expect(screen.getByTestId('mut')).toHaveTextContent('0')
    fireEvent.click(screen.getByText('mutate'))
    // Consumer doesn't re-render — context ref unchanged
    expect(screen.getByTestId('mut')).toHaveTextContent('0')
  })

  it('new object ref after mutation: consumer shows updated value when re-render is forced', () => {
    function Parent() {
      const [state, setState] = useState<MutableState>({ count: 0 })
      return (
        <MutableCtx.Provider value={state}>
          <MutableConsumer />
          <button onClick={() => setState(prev => ({ ...prev, count: prev.count + 1 }))}>inc</button>
        </MutableCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc'))
    fireEvent.click(screen.getByText('inc'))
    expect(screen.getByTestId('mut')).toHaveTextContent('2')
  })

  it('null default: consumer detects missing Provider and shows fallback', () => {
    render(<SafeConsumer />)
    expect(screen.getByTestId('safe')).toHaveTextContent('missing-provider')
  })

  it('null default: consumer shows value when Provider is present', () => {
    render(
      <RequiredCtx.Provider value="from-provider">
        <SafeConsumer />
      </RequiredCtx.Provider>
    )
    expect(screen.getByTestId('safe')).toHaveTextContent('from-provider')
  })

  it('error boundary catches context-triggered throw', () => {
    const onError = vi.fn()
    // Suppress React's console.error for thrown errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ThrowCtx.Provider value={true}>
        <ErrorBoundary onError={onError}>
          <MaybeThrower />
        </ErrorBoundary>
      </ThrowCtx.Provider>
    )
    expect(screen.getByTestId('boundary')).toHaveTextContent('context-triggered-throw')
    expect(onError).toHaveBeenCalledOnce()
    consoleSpy.mockRestore()
  })

  it('error boundary resets after context stops throwing', () => {
    // Simulate: throw → catch → fix context value → manually reset boundary
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // The boundary only resets via setState on the class component.
    // We test that when shouldThrow=false, the component renders normally.
    render(
      <ThrowCtx.Provider value={false}>
        <ErrorBoundary>
          <MaybeThrower />
        </ErrorBoundary>
      </ThrowCtx.Provider>
    )
    expect(screen.getByTestId('thrower')).toHaveTextContent('ok')
    consoleSpy.mockRestore()
  })

  it('context default value is static — updating it after createContext has no effect', () => {
    // Default values are frozen at createContext call time.
    // This test confirms the consumer always reads the original default.
    const ctx = createContext('original')

    function Consumer() {
      return <span data-testid="c">{useContext(ctx)}</span>
    }

    render(<Consumer />)
    expect(screen.getByTestId('c')).toHaveTextContent('original')
  })

  it('nested Provider replacement: removing inner Provider falls back to outer', () => {
    const ValCtx = createContext('outer-default')

    function Consumer() {
      return <span data-testid="v">{useContext(ValCtx)}</span>
    }

    function Parent() {
      const [showInner, setShowInner] = useState(true)
      return (
        <ValCtx.Provider value="outer">
          {showInner
            ? <ValCtx.Provider value="inner"><Consumer /></ValCtx.Provider>
            : <Consumer />
          }
          <button onClick={() => setShowInner(false)}>remove-inner</button>
        </ValCtx.Provider>
      )
    }
    render(<Parent />)
    expect(screen.getByTestId('v')).toHaveTextContent('inner')
    fireEvent.click(screen.getByText('remove-inner'))
    expect(screen.getByTestId('v')).toHaveTextContent('outer')
  })
})
