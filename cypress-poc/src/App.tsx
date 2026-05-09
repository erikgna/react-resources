import { useState } from 'react'
import SelectorsExperiment from './experiments/01-selectors/SelectorsExperiment'
import InteractionsExperiment from './experiments/02-interactions/InteractionsExperiment'
import AssertionsExperiment from './experiments/03-assertions/AssertionsExperiment'
import NetworkExperiment from './experiments/04-network/NetworkExperiment'
import AsyncExperiment from './experiments/05-async/AsyncExperiment'
import FormsExperiment from './experiments/06-forms/FormsExperiment'
import ComponentExperiment from './experiments/07-component/ComponentExperiment'
import FailuresExperiment from './experiments/08-failures/FailuresExperiment'

const TABS = [
  { id: '01', label: '1 · Selectors',    component: SelectorsExperiment },
  { id: '02', label: '2 · Interactions', component: InteractionsExperiment },
  { id: '03', label: '3 · Assertions',   component: AssertionsExperiment },
  { id: '04', label: '4 · Network',      component: NetworkExperiment },
  { id: '05', label: '5 · Async',        component: AsyncExperiment },
  { id: '06', label: '6 · Forms',        component: FormsExperiment },
  { id: '07', label: '7 · Component',    component: ComponentExperiment },
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
          Cypress POC
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
