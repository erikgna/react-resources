import { useState } from 'react'
import AtomsExperiment from './experiments/01-atoms/AtomsExperiment'
import DerivedExperiment from './experiments/02-derived/DerivedExperiment'
import WriteAtomsExperiment from './experiments/03-write-atoms/WriteAtomsExperiment'
import AsyncExperiment from './experiments/04-async/AsyncExperiment'
import FamiliesExperiment from './experiments/05-families/FamiliesExperiment'
import AdvancedExperiment from './experiments/06-advanced/AdvancedExperiment'
import PerformanceExperiment from './experiments/07-performance/PerformanceExperiment'
import FailuresExperiment from './experiments/08-failures/FailuresExperiment'

const TABS = [
  { id: '01', label: '1 · Atoms',        component: AtomsExperiment },
  { id: '02', label: '2 · Derived',      component: DerivedExperiment },
  { id: '03', label: '3 · Write Atoms',  component: WriteAtomsExperiment },
  { id: '04', label: '4 · Async',        component: AsyncExperiment },
  { id: '05', label: '5 · Families',     component: FamiliesExperiment },
  { id: '06', label: '6 · Advanced',     component: AdvancedExperiment },
  { id: '07', label: '7 · Performance',  component: PerformanceExperiment },
  { id: '08', label: '8 · Failures',     component: FailuresExperiment },
]

export default function App() {
  const [active, setActive] = useState('01')
  const ActiveExperiment = TABS.find(t => t.id === active)!.component

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <nav style={{
        width: 175, background: '#141414', borderRight: '1px solid #222',
        padding: '12px 0', flexShrink: 0, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '0 14px 14px', color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>
          Jotai POC
        </div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '7px 14px', border: 'none', borderRadius: 0,
            background: active === t.id ? '#1e1e1e' : 'transparent',
            color: active === t.id ? '#e0e0e0' : '#666',
            borderLeft: active === t.id ? '2px solid #4a9eff' : '2px solid transparent',
            fontSize: 12, lineHeight: 1.5,
          }}>
            {t.label}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <ActiveExperiment />
      </main>
    </div>
  )
}
