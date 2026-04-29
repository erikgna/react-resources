import { useState } from 'react'
import ObservableExperiment from './experiments/01-observable/ObservableExperiment'
import ComputedExperiment from './experiments/02-computed/ComputedExperiment'
import ReactionsExperiment from './experiments/03-reactions/ReactionsExperiment'
import ActionsExperiment from './experiments/04-actions/ActionsExperiment'
import ObserverExperiment from './experiments/05-observer/ObserverExperiment'
import StoresExperiment from './experiments/06-stores/StoresExperiment'
import PerformanceExperiment from './experiments/07-performance/PerformanceExperiment'
import FailuresExperiment from './experiments/08-failures/FailuresExperiment'

const TABS = [
  { id: '01', label: '1 · Observable', component: ObservableExperiment },
  { id: '02', label: '2 · Computed', component: ComputedExperiment },
  { id: '03', label: '3 · Reactions', component: ReactionsExperiment },
  { id: '04', label: '4 · Actions', component: ActionsExperiment },
  { id: '05', label: '5 · Observer', component: ObserverExperiment },
  { id: '06', label: '6 · Stores', component: StoresExperiment },
  { id: '07', label: '7 · Performance', component: PerformanceExperiment },
  { id: '08', label: '8 · Failures', component: FailuresExperiment },
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
          MobX POC
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
