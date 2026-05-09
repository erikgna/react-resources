import { useState } from 'react'
import LocatorsExperiment from './experiments/01-locators/LocatorsExperiment'
import ActionsExperiment from './experiments/02-actions/ActionsExperiment'
import AssertionsExperiment from './experiments/03-assertions/AssertionsExperiment'
import AsyncExperiment from './experiments/04-async/AsyncExperiment'
import NetworkExperiment from './experiments/05-network/NetworkExperiment'
import PageObjectsExperiment from './experiments/06-page-objects/PageObjectsExperiment'
import AccessibilityExperiment from './experiments/07-accessibility/AccessibilityExperiment'
import FailuresExperiment from './experiments/08-failures/FailuresExperiment'

const TABS = [
  { id: '01', label: '1 · Locators',      component: LocatorsExperiment },
  { id: '02', label: '2 · Actions',        component: ActionsExperiment },
  { id: '03', label: '3 · Assertions',     component: AssertionsExperiment },
  { id: '04', label: '4 · Async',          component: AsyncExperiment },
  { id: '05', label: '5 · Network',        component: NetworkExperiment },
  { id: '06', label: '6 · Page Objects',   component: PageObjectsExperiment },
  { id: '07', label: '7 · Accessibility',  component: AccessibilityExperiment },
  { id: '08', label: '8 · Failures',       component: FailuresExperiment },
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
          Playwright CT
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
