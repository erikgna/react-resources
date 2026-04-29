import { useState } from 'react'
import PropagationExperiment from './experiments/01-propagation/PropagationExperiment'
import RerendersExperiment from './experiments/02-rerenders/RerendersExperiment'
import OptimizationExperiment from './experiments/03-optimization/OptimizationExperiment'
import ReducerExperiment from './experiments/04-reducer/ReducerExperiment'
import CompositionExperiment from './experiments/05-composition/CompositionExperiment'
import DynamicExperiment from './experiments/06-dynamic/DynamicExperiment'
import PerformanceExperiment from './experiments/07-performance/PerformanceExperiment'
import FailureExperiment from './experiments/08-failures/FailureExperiment'
import AdvancedExperiment from './experiments/09-advanced/AdvancedExperiment'

const TABS = [
  { id: '01', label: '1 · Propagation',  component: PropagationExperiment },
  { id: '02', label: '2 · Re-renders',   component: RerendersExperiment },
  { id: '03', label: '3 · Optimization', component: OptimizationExperiment },
  { id: '04', label: '4 · useReducer',   component: ReducerExperiment },
  { id: '05', label: '5 · Composition',  component: CompositionExperiment },
  { id: '06', label: '6 · Dynamic',      component: DynamicExperiment },
  { id: '07', label: '7 · Performance',  component: PerformanceExperiment },
  { id: '08', label: '8 · Failures',     component: FailureExperiment },
  { id: '09', label: '9 · Advanced',     component: AdvancedExperiment },
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
          Context API POC
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
