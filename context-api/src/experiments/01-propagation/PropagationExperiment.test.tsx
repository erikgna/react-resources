import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createContext, useContext } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NumCtx = createContext(99)
const ObjCtx = createContext<{ name: string }>({ name: 'default' })
const ThemeCtx = createContext('dark')

function NumConsumer() {
  return <span data-testid="num">{useContext(NumCtx)}</span>
}
function ObjConsumer() {
  return <span data-testid="obj">{useContext(ObjCtx).name}</span>
}
function ThemeConsumer() {
  return <span data-testid="theme">{useContext(ThemeCtx)}</span>
}
function LegacyConsumer() {
  return (
    <NumCtx.Consumer>
      {(val) => <span data-testid="legacy">{val}</span>}
    </NumCtx.Consumer>
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('01 · Propagation — createContext + Provider', () => {
  it('consumer reads Provider value', () => {
    render(
      <NumCtx.Provider value={42}>
        <NumConsumer />
      </NumCtx.Provider>
    )
    expect(screen.getByTestId('num')).toHaveTextContent('42')
  })

  it('consumer falls back to default when no Provider', () => {
    render(<NumConsumer />)
    expect(screen.getByTestId('num')).toHaveTextContent('99')
  })

  it('object context propagates name field', () => {
    render(
      <ObjCtx.Provider value={{ name: 'alice' }}>
        <ObjConsumer />
      </ObjCtx.Provider>
    )
    expect(screen.getByTestId('obj')).toHaveTextContent('alice')
  })

  it('object context default value used without Provider', () => {
    render(<ObjConsumer />)
    expect(screen.getByTestId('obj')).toHaveTextContent('default')
  })

  it('inner Provider shadows outer Provider', () => {
    render(
      <ThemeCtx.Provider value="dark">
        <ThemeCtx.Provider value="light">
          <ThemeConsumer />
        </ThemeCtx.Provider>
      </ThemeCtx.Provider>
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('outer Provider reached when inner is removed', () => {
    render(
      <ThemeCtx.Provider value="dark">
        <ThemeConsumer />
      </ThemeCtx.Provider>
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('multiple consumers all read same Provider value', () => {
    render(
      <NumCtx.Provider value={7}>
        <NumConsumer />
        <NumConsumer />
        <NumConsumer />
      </NumCtx.Provider>
    )
    screen.getAllByTestId('num').forEach(el => {
      expect(el).toHaveTextContent('7')
    })
  })

  it('legacy Consumer render-prop API reads same value as useContext', () => {
    render(
      <NumCtx.Provider value={55}>
        <NumConsumer />
        <LegacyConsumer />
      </NumCtx.Provider>
    )
    expect(screen.getByTestId('num')).toHaveTextContent('55')
    expect(screen.getByTestId('legacy')).toHaveTextContent('55')
  })

  it('nested providers: sibling subtrees read outer Provider independently', () => {
    render(
      <ThemeCtx.Provider value="dark">
        <div data-testid="outer">
          <ThemeConsumer />
        </div>
        <ThemeCtx.Provider value="light">
          <div data-testid="inner">
            <ThemeConsumer />
          </div>
        </ThemeCtx.Provider>
      </ThemeCtx.Provider>
    )
    expect(screen.getAllByTestId('theme')[0]).toHaveTextContent('dark')
    expect(screen.getAllByTestId('theme')[1]).toHaveTextContent('light')
  })

  it('null default value: consumer returns null without Provider', () => {
    const NullCtx = createContext<string | null>(null)
    function NullConsumer() {
      const val = useContext(NullCtx)
      return <span data-testid="null">{val ?? 'was-null'}</span>
    }
    render(<NullConsumer />)
    expect(screen.getByTestId('null')).toHaveTextContent('was-null')
  })
})
