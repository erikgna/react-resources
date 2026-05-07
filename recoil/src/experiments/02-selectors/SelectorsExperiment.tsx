import { useRef } from 'react'
import { atom, selector, useRecoilState, useRecoilValue, RecoilRoot } from 'recoil'
import {
  atom as coreAtom,
  selector as coreSelector,
  useRecoilValue as coreUseValue,
  useRecoilState as coreUseState,
  RecoilRoot as CoreRoot,
} from '../../core/recoil'
import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── Recoil atoms + selectors ─────────────────────────────────────────────────

const itemsAtom  = atom<string[]>({ key: '02/items', default: ['apple', 'banana', 'cherry', 'avocado', 'blueberry'] })
const filterAtom = atom<string>({ key: '02/filter', default: '' })

const filteredSelector = selector({
  key: '02/filtered',
  get: ({ get }) => {
    const items  = get(itemsAtom)
    const filter = get(filterAtom)
    return filter ? items.filter(i => i.toLowerCase().includes(filter.toLowerCase())) : items
  },
})

const firstNameAtom = atom({ key: '02/firstName', default: 'John' })
const lastNameAtom  = atom({ key: '02/lastName',  default: 'Doe' })

const fullNameSelector = selector({
  key: '02/fullName',
  get: ({ get }) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
})

// Selector depending on another selector
const initialsSelector = selector({
  key: '02/initials',
  get: ({ get }) => {
    const full = get(fullNameSelector)
    return full.split(' ').map((w: string) => w[0]?.toUpperCase() ?? '').join('')
  },
})

const baseAtom       = atom({ key: '02/base',       default: 3 })
const multiplierAtom = atom({ key: '02/multiplier', default: 4 })

const productSelector = selector({
  key: '02/product',
  get: ({ get }) => get(baseAtom) * get(multiplierAtom),
})

const squaredProductSelector = selector({
  key: '02/squaredProduct',
  get: ({ get }) => {
    const p = get(productSelector)  // selector → selector chain
    return p * p
  },
})

// ─── Core atoms + selectors ───────────────────────────────────────────────────

const coreBaseAtom = coreAtom({ key: 'core-02/base', default: 5 })
const coreMulAtom  = coreAtom({ key: 'core-02/mul',  default: 3 })

const coreProductSel = coreSelector({
  key: 'core-02/product',
  get: ({ get }) => get(coreBaseAtom) * get(coreMulAtom),
})

// ─── 2.1 Basic filtered list ──────────────────────────────────────────────────

function FilteredList() {
  const [filter, setFilter] = useRecoilState(filterAtom)
  const filtered = useRecoilValue(filteredSelector)
  const renders = useRef(0); renders.current++
  return (
    <Section title="2.1 — Sync selector: derived filtered list">
      <Info>Selector re-computes only when its deps change. It caches the result — multiple reads within one render hit the cache.</Info>
      <Row>
        <input
          value={filter} onChange={e => setFilter(e.target.value)}
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '4px 8px', borderRadius: 3, fontSize: 13 }}
          placeholder="filter..."
        />
        <span style={{ color: '#555', fontSize: 11 }}>renders: <span style={{ color: '#4caf50' }}>{renders.current}</span></span>
      </Row>
      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {filtered.map(item => (
          <span key={item} style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#79c0ff', borderRadius: 3, padding: '3px 8px', fontSize: 12 }}>
            {item}
          </span>
        ))}
        {filtered.length === 0 && <span style={{ color: '#444', fontSize: 12 }}>no matches</span>}
      </div>
      <Pre>{`const filteredSelector = selector({
  key: 'filtered',
  get: ({ get }) => {
    const items  = get(itemsAtom)   // dep 1
    const filter = get(filterAtom)  // dep 2
    return items.filter(i => i.includes(filter))
  }
})
// Cache invalidated when itemsAtom OR filterAtom changes
// Computed lazily — only when a component reads it`}</Pre>
    </Section>
  )
}

// ─── 2.2 Multi-dep selector ───────────────────────────────────────────────────

function MultiDepSelector() {
  const [first, setFirst] = useRecoilState(firstNameAtom)
  const [last,  setLast]  = useRecoilState(lastNameAtom)
  const fullName = useRecoilValue(fullNameSelector)
  const initials = useRecoilValue(initialsSelector)
  return (
    <Section title="2.2 — Multi-dep selector + selector chaining">
      <Info>fullNameSelector reads two atoms. initialsSelector reads fullNameSelector (selector-to-selector dep). Changing either name invalidates both downstream selectors.</Info>
      <Row style={{ marginBottom: 8 }}>
        <input value={first} onChange={e => setFirst(e.target.value)}
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '4px 8px', borderRadius: 3, fontSize: 13, width: 100 }} />
        <input value={last} onChange={e => setLast(e.target.value)}
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '4px 8px', borderRadius: 3, fontSize: 13, width: 100 }} />
      </Row>
      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.8 }}>
        fullName: <span style={{ color: '#e0e0e0' }}>{fullName}</span>
        {'  ·  '}initials: <span style={{ color: '#4a9eff' }}>{initials}</span>
      </div>
      <Pre>{`const fullNameSelector = selector({
  key: 'fullName',
  get: ({ get }) => \`\${get(firstAtom)} \${get(lastAtom)}\`
})

const initialsSelector = selector({
  key: 'initials',
  get: ({ get }) => {
    const full = get(fullNameSelector)  // ← reads another selector
    return full.split(' ').map(w => w[0]).join('')
  }
})
// Dep graph: firstAtom → fullName → initials
//            lastAtom  ↗`}</Pre>
    </Section>
  )
}

// ─── 2.3 Selector chain: product → squared ───────────────────────────────────

function SelectorChain() {
  const [base, setBase] = useRecoilState(baseAtom)
  const [mul,  setMul]  = useRecoilState(multiplierAtom)
  const product  = useRecoilValue(productSelector)
  const squared  = useRecoilValue(squaredProductSelector)
  return (
    <Section title="2.3 — Selector chain: product → squaredProduct">
      <Info>squaredProductSelector reads productSelector. Changing base or multiplier invalidates both in one shot — Recoil propagates through the dep graph.</Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => setBase(b => b - 1)} danger>base −</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 13 }}>{base}</span>
        <Btn onClick={() => setBase(b => b + 1)}>base +</Btn>
        <span style={{ color: '#555' }}>×</span>
        <Btn onClick={() => setMul(m => m - 1)} danger>mul −</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 13 }}>{mul}</span>
        <Btn onClick={() => setMul(m => m + 1)}>mul +</Btn>
      </Row>
      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.8 }}>
        product = <span style={{ color: '#e0e0e0' }}>{base} × {mul} = {product}</span>
        {'  ·  '}squared = <span style={{ color: '#4a9eff' }}>{product}² = {squared}</span>
      </div>
      <Pre>{`const productSelector = selector({
  get: ({ get }) => get(baseAtom) * get(multiplierAtom)
})
const squaredProductSelector = selector({
  get: ({ get }) => {
    const p = get(productSelector)  // reads another selector
    return p * p
  }
})
// Recoil builds: baseAtom ──→ productSelector ──→ squaredProductSelector
//                mulAtom  ↗`}</Pre>
    </Section>
  )
}

// ─── 2.4 Core selector reimplementation ──────────────────────────────────────

function CoreSelectorDemo() {
  const [base, setBase] = coreUseState(coreBaseAtom)
  const [mul,  setMul]  = coreUseState(coreMulAtom)
  const product = coreUseValue(coreProductSel)
  return (
    <Section title="2.4 — core/recoil.ts — hand-rolled SelectorNode">
      <Info>During getSelectorValue(), a get() proxy tracks which atoms are accessed → atomDeps set. On setAtomValue(), dependent selectors are marked dirty. Next read re-evaluates.</Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => setBase(b => b - 1)} danger>base −</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 13 }}>{base}</span>
        <Btn onClick={() => setBase(b => b + 1)}>base +</Btn>
        <span style={{ color: '#555' }}>×</span>
        <Btn onClick={() => setMul(m => m - 1)} danger>mul −</Btn>
        <span style={{ color: '#e0e0e0', fontSize: 13 }}>{mul}</span>
        <Btn onClick={() => setMul(m => m + 1)}>mul +</Btn>
        <span style={{ color: '#888', fontSize: 13 }}>= <span style={{ color: '#4a9eff' }}>{product}</span></span>
      </Row>
      <Pre>{`// core/recoil.ts — getSelectorValue
getSelectorValue(node) {
  if (!state.dirty) return state.cachedValue  // cache hit

  const deps = new Set<string>()
  const value = getFn({
    get: (dep) => {
      deps.add(dep.key)        // ← record dependency
      return getAtomValue(dep)
    }
  })
  state.atomDeps = deps        // store dep graph
  state.dirty = false
  return state.cachedValue = value
}`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function SelectorsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>02 · Selectors</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Selectors are pure, cached, reactive derivations. They read atoms (or other selectors) via a tracked
        <code>get()</code>, build a dep graph, and re-compute lazily when any dep changes.
      </p>
      <RecoilRoot>
        <FilteredList />
        <MultiDepSelector />
        <SelectorChain />
      </RecoilRoot>
      <CoreRoot>
        <CoreSelectorDemo />
      </CoreRoot>
    </div>
  )
}
