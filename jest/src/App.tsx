import { useState } from 'react'
import MatchersExperiment from './experiments/01-matchers/MatchersExperiment'
import MockFnsExperiment from './experiments/02-mock-functions/MockFnsExperiment'
import ModuleMockExperiment from './experiments/03-module-mocking/ModuleMockExperiment'
import TimersExperiment from './experiments/04-timers/TimersExperiment'
import SnapshotsExperiment from './experiments/05-snapshots/SnapshotsExperiment'
import AsyncExperiment from './experiments/06-async/AsyncExperiment'
import CoverageExperiment from './experiments/07-coverage/CoverageExperiment'
import ConfigExperiment from './experiments/08-config/ConfigExperiment'

const TABS = [
  { id: '01', label: '1 · Matchers',       component: MatchersExperiment },
  { id: '02', label: '2 · Mock Functions',  component: MockFnsExperiment },
  { id: '03', label: '3 · Module Mocking',  component: ModuleMockExperiment },
  { id: '04', label: '4 · Timers',          component: TimersExperiment },
  { id: '05', label: '5 · Snapshots',       component: SnapshotsExperiment },
  { id: '06', label: '6 · Async',           component: AsyncExperiment },
  { id: '07', label: '7 · Coverage',        component: CoverageExperiment },
  { id: '08', label: '8 · Config',          component: ConfigExperiment },
]

export default function App() {
  const [active, setActive] = useState('01')
  const ActiveExperiment = TABS.find(t => t.id === active)!.component

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <nav style={{
        width: 185, background: '#141414', borderRight: '1px solid #222',
        padding: '12px 0', flexShrink: 0, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '0 14px 14px', color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>
          Jest POC
        </div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '7px 14px', border: 'none', borderRadius: 0,
            background: active === t.id ? '#1e1e1e' : 'transparent',
            color: active === t.id ? '#e0e0e0' : '#666',
            borderLeft: active === t.id ? '2px solid #c678dd' : '2px solid transparent',
            fontSize: 12, lineHeight: 1.5, cursor: 'pointer',
          }}>
            {t.label}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, overflow: 'auto', padding: 28, background: '#0d0d0d', color: '#ccc' }}>
        <ActiveExperiment />
      </main>
    </div>
  )
}
