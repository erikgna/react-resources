import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createContext, useContext, useMemo, useState, useRef, memo } from 'react'

// ─── Fat context ──────────────────────────────────────────────────────────────

type FatState = { a: number; b: number; c: number; d: number; e: number }
const FatCtx = createContext<FatState>({ a: 0, b: 0, c: 0, d: 0, e: 0 })

// ─── Split contexts ───────────────────────────────────────────────────────────

const ACtx = createContext(0)
const BCtx = createContext(0)
const CCtx = createContext(0)
const DCtx = createContext(0)
const ECtx = createContext(0)

// ─── Render counter ───────────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current++
  return ref.current
}

// ─── Fat consumers ────────────────────────────────────────────────────────────

function FatA({ id }: { id: string }) { const { a } = useContext(FatCtx); const r = useRenderCount(); return <div data-testid={id} data-renders={r}>{a}</div> }
function FatB({ id }: { id: string }) { const { b } = useContext(FatCtx); const r = useRenderCount(); return <div data-testid={id} data-renders={r}>{b}</div> }
function FatC({ id }: { id: string }) { const { c } = useContext(FatCtx); const r = useRenderCount(); return <div data-testid={id} data-renders={r}>{c}</div> }

// ─── Split consumers (memo required to isolate context-vs-parent re-renders) ──

const SplitA = memo(function SplitA({ id }: { id: string }) { const a = useContext(ACtx); const r = useRenderCount(); return <div data-testid={id} data-renders={r}>{a}</div> })
const SplitB = memo(function SplitB({ id }: { id: string }) { const b = useContext(BCtx); const r = useRenderCount(); return <div data-testid={id} data-renders={r}>{b}</div> })
const SplitC = memo(function SplitC({ id }: { id: string }) { const c = useContext(CCtx); const r = useRenderCount(); return <div data-testid={id} data-renders={r}>{c}</div> })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('07 · Performance — fat ctx vs split ctx re-render counts', () => {
  it('fat ctx: all consumers re-render when any single field changes', () => {
    function Parent() {
      const [fat, setFat] = useState<FatState>({ a: 0, b: 0, c: 0, d: 0, e: 0 })
      const memo = useMemo(() => fat, [fat.a, fat.b, fat.c, fat.d, fat.e])
      return (
        <FatCtx.Provider value={memo}>
          <FatA id="fa" />
          <FatB id="fb" />
          <FatC id="fc" />
          <button onClick={() => setFat(f => ({ ...f, a: f.a + 1 }))}>inc-a</button>
        </FatCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc-a'))
    fireEvent.click(screen.getByText('inc-a'))
    // All three re-render because fat ctx value is new (even though only a changed)
    expect(screen.getByTestId('fa').getAttribute('data-renders')).toBe('3')
    expect(screen.getByTestId('fb').getAttribute('data-renders')).toBe('3')
    expect(screen.getByTestId('fc').getAttribute('data-renders')).toBe('3')
  })

  it('split ctx: changing A only re-renders A consumer', () => {
    function Parent() {
      const [vals, setVals] = useState({ a: 0, b: 0, c: 0, d: 0, e: 0 })
      return (
        <ACtx.Provider value={vals.a}>
          <BCtx.Provider value={vals.b}>
            <CCtx.Provider value={vals.c}>
              <DCtx.Provider value={vals.d}>
                <ECtx.Provider value={vals.e}>
                  <SplitA id="sa" />
                  <SplitB id="sb" />
                  <SplitC id="sc" />
                  <button onClick={() => setVals(v => ({ ...v, a: v.a + 1 }))}>inc-a</button>
                </ECtx.Provider>
              </DCtx.Provider>
            </CCtx.Provider>
          </BCtx.Provider>
        </ACtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc-a'))
    fireEvent.click(screen.getByText('inc-a'))
    expect(screen.getByTestId('sa').getAttribute('data-renders')).toBe('3')
    // B and C contexts unchanged → their consumers stay at 1
    expect(screen.getByTestId('sb').getAttribute('data-renders')).toBe('1')
    expect(screen.getByTestId('sc').getAttribute('data-renders')).toBe('1')
  })

  it('split ctx: changing B only re-renders B consumer', () => {
    function Parent() {
      const [vals, setVals] = useState({ a: 0, b: 0, c: 0, d: 0, e: 0 })
      return (
        <ACtx.Provider value={vals.a}>
          <BCtx.Provider value={vals.b}>
            <CCtx.Provider value={vals.c}>
              <DCtx.Provider value={vals.d}>
                <ECtx.Provider value={vals.e}>
                  <SplitA id="sa" />
                  <SplitB id="sb" />
                  <SplitC id="sc" />
                  <button onClick={() => setVals(v => ({ ...v, b: v.b + 1 }))}>inc-b</button>
                </ECtx.Provider>
              </DCtx.Provider>
            </CCtx.Provider>
          </BCtx.Provider>
        </ACtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc-b'))
    fireEvent.click(screen.getByText('inc-b'))
    expect(screen.getByTestId('sa').getAttribute('data-renders')).toBe('1')
    expect(screen.getByTestId('sb').getAttribute('data-renders')).toBe('3')
    expect(screen.getByTestId('sc').getAttribute('data-renders')).toBe('1')
  })

  it('fat ctx re-renders all consumers even when only unrelated field changes', () => {
    // This is the defining weakness: 3 consumers monitoring a, b, c
    // but only e (unused by any consumer) changes — still all re-render
    function Parent() {
      const [fat, setFat] = useState<FatState>({ a: 0, b: 0, c: 0, d: 0, e: 0 })
      const memo = useMemo(() => fat, [fat.a, fat.b, fat.c, fat.d, fat.e])
      return (
        <FatCtx.Provider value={memo}>
          <FatA id="fa" />
          <FatB id="fb" />
          <FatC id="fc" />
          <button onClick={() => setFat(f => ({ ...f, e: f.e + 1 }))}>inc-e</button>
        </FatCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc-e'))
    // Only e changed, but A/B/C consumers still re-render because ctx obj is new
    expect(screen.getByTestId('fa').getAttribute('data-renders')).toBe('2')
    expect(screen.getByTestId('fb').getAttribute('data-renders')).toBe('2')
    expect(screen.getByTestId('fc').getAttribute('data-renders')).toBe('2')
  })

  it('split ctx: changing unmonitored field (e) does not re-render a/b/c consumers', () => {
    function Parent() {
      const [vals, setVals] = useState({ a: 0, b: 0, c: 0, d: 0, e: 0 })
      return (
        <ACtx.Provider value={vals.a}>
          <BCtx.Provider value={vals.b}>
            <CCtx.Provider value={vals.c}>
              <DCtx.Provider value={vals.d}>
                <ECtx.Provider value={vals.e}>
                  <SplitA id="sa" />
                  <SplitB id="sb" />
                  <SplitC id="sc" />
                  <button onClick={() => setVals(v => ({ ...v, e: v.e + 1 }))}>inc-e</button>
                </ECtx.Provider>
              </DCtx.Provider>
            </CCtx.Provider>
          </BCtx.Provider>
        </ACtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('inc-e'))
    // A/B/C ctx values unchanged → no re-renders
    expect(screen.getByTestId('sa').getAttribute('data-renders')).toBe('1')
    expect(screen.getByTestId('sb').getAttribute('data-renders')).toBe('1')
    expect(screen.getByTestId('sc').getAttribute('data-renders')).toBe('1')
  })
})
