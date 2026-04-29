import { useState } from 'react'
import RawStoreExperiment from './experiments/01-raw-store/RawStoreExperiment'
import ManualReactExperiment from './experiments/02-manual-react/ManualReactExperiment'
import ReactReduxExperiment from './experiments/03-react-redux/ReactReduxExperiment'
import MiddlewareExperiment from './experiments/04-middleware/MiddlewareExperiment'
import AsyncExperiment from './experiments/05-async/AsyncExperiment'
import ToolkitExperiment from './experiments/06-toolkit/ToolkitExperiment'
import PerformanceExperiment from './experiments/07-performance/PerformanceExperiment'
import FailureExperiment from './experiments/08-failures/FailureExperiment'
import AdvancedExperiment from './experiments/09-advanced/AdvancedExperiment'

const TABS = [
  { id: '01', label: '1 · Raw Store', component: RawStoreExperiment },
  { id: '02', label: '2 · Manual React', component: ManualReactExperiment },
  { id: '03', label: '3 · React-Redux', component: ReactReduxExperiment },
  { id: '04', label: '4 · Middleware', component: MiddlewareExperiment },
  { id: '05', label: '5 · Async', component: AsyncExperiment },
  { id: '06', label: '6 · Toolkit', component: ToolkitExperiment },
  { id: '07', label: '7 · Performance', component: PerformanceExperiment },
  { id: '08', label: '8 · Failures', component: FailureExperiment },
  { id: '09', label: '9 · Advanced', component: AdvancedExperiment },
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
          Redux POC
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
