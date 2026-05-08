import type { CSSProperties } from 'react'
import { useMachine } from '@xstate/react'
import { createMachine } from 'xstate'
import { Section, Row, Btn, Info, Pre, StateChip } from '../shared'

// ─── Compound states ──────────────────────────────────────────────────────────
// state.value returns an object for nested states: { loading: 'fetching' }
const loadMachine = createMachine({
  id: 'load',
  initial: 'loading',
  states: {
    loading: {
      initial: 'idle',
      states: {
        idle:     { on: { START: 'fetching' } },
        fetching: { on: { SUCCESS: '#load.loaded', FAIL: '#load.failed' } },
      },
    },
    loaded: { on: { RESET: 'loading' } },
    failed: { on: { RETRY: 'loading.fetching', RESET: 'loading' } },
  },
})

function CompoundDemo() {
  const [state, send] = useMachine(loadMachine)
  const value = JSON.stringify(state.value)

  return (
    <div>
      <Row style={{ marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
        <StateChip value="loading.idle"     active={state.matches({ loading: 'idle' })} />
        <StateChip value="loading.fetching" active={state.matches({ loading: 'fetching' })} />
        <StateChip value="loaded"           active={state.matches('loaded')} />
        <StateChip value="failed"           active={state.matches('failed')} />
      </Row>
      <Row style={{ marginBottom: 8 }}>
        {state.matches({ loading: 'idle' })     && <Btn onClick={() => send({ type: 'START' })}>START</Btn>}
        {state.matches({ loading: 'fetching' }) && (
          <>
            <Btn onClick={() => send({ type: 'SUCCESS' })}>Succeed</Btn>
            <Btn onClick={() => send({ type: 'FAIL' })} danger>Fail</Btn>
          </>
        )}
        {state.matches('loaded') && <Btn onClick={() => send({ type: 'RESET' })}>Reset</Btn>}
        {state.matches('failed') && (
          <>
            <Btn onClick={() => send({ type: 'RETRY' })}>Retry</Btn>
            <Btn onClick={() => send({ type: 'RESET' })} danger>Reset</Btn>
          </>
        )}
      </Row>
      <div style={{ fontSize: 12, color: '#555' }}>
        state.value = <code>{value}</code>
      </div>
    </div>
  )
}

// ─── Parent-level transitions ─────────────────────────────────────────────────
// Events on a parent state apply to ALL child states
const wizardMachine = createMachine({
  id: 'wizard',
  initial: 'filling',
  states: {
    filling: {
      // CANCEL applies to all child states without repeating it in each
      on: { CANCEL: 'cancelled' },
      initial: 'step1',
      states: {
        step1: { on: { NEXT: 'step2' } },
        step2: { on: { NEXT: 'step3', BACK: 'step1' } },
        step3: { on: { SUBMIT: '#wizard.submitted', BACK: 'step2' } },
      },
    },
    submitted: {},
    cancelled: { on: { RESTART: 'filling' } },
  },
})

function WizardDemo() {
  const [state, send] = useMachine(wizardMachine)
  const value = JSON.stringify(state.value)
  const isStep = (n: number) => state.matches({ filling: `step${n}` })

  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        {[1, 2, 3].map(n => <StateChip key={n} value={`step${n}`} active={isStep(n)} />)}
        <StateChip value="submitted" active={state.matches('submitted')} />
        <StateChip value="cancelled" active={state.matches('cancelled')} />
      </Row>
      <Row style={{ marginBottom: 8 }}>
        {isStep(1) && <Btn onClick={() => send({ type: 'NEXT' })}>Next</Btn>}
        {isStep(2) && <>
          <Btn onClick={() => send({ type: 'BACK' })}>Back</Btn>
          <Btn onClick={() => send({ type: 'NEXT' })}>Next</Btn>
        </>}
        {isStep(3) && <>
          <Btn onClick={() => send({ type: 'BACK' })}>Back</Btn>
          <Btn onClick={() => send({ type: 'SUBMIT' })}>Submit</Btn>
        </>}
        {(isStep(1) || isStep(2) || isStep(3)) &&
          <Btn onClick={() => send({ type: 'CANCEL' })} danger>Cancel</Btn>}
        {state.matches('submitted') && <span style={{ color: '#4caf50', fontSize: 13 }}>Submitted!</span>}
        {state.matches('cancelled') && <Btn onClick={() => send({ type: 'RESTART' })}>Restart</Btn>}
      </Row>
      <div style={{ fontSize: 12, color: '#555' }}>state.value = <code>{value}</code></div>
      <Info style={{ marginTop: 8 }}>
        CANCEL is defined once on <em>filling</em>, not repeated in step1/step2/step3.
        Parent-level <code>on</code> events bubble to all child states automatically.
      </Info>
    </div>
  )
}

// ─── Parallel states ──────────────────────────────────────────────────────────
const editorMachine = createMachine({
  id: 'editor',
  type: 'parallel',
  states: {
    bold: {
      initial: 'off',
      states: {
        off: { on: { TOGGLE_BOLD: 'on' } },
        on:  { on: { TOGGLE_BOLD: 'off' } },
      },
    },
    italic: {
      initial: 'off',
      states: {
        off: { on: { TOGGLE_ITALIC: 'on' } },
        on:  { on: { TOGGLE_ITALIC: 'off' } },
      },
    },
    underline: {
      initial: 'off',
      states: {
        off: { on: { TOGGLE_UNDERLINE: 'on' } },
        on:  { on: { TOGGLE_UNDERLINE: 'off' } },
      },
    },
  },
})

function ParallelDemo() {
  const [state, send] = useMachine(editorMachine)
  const isBold      = state.matches({ bold: 'on' })
  const isItalic    = state.matches({ italic: 'on' })
  const isUnderline = state.matches({ underline: 'on' })

  const sampleStyle = {
    fontWeight:      isBold      ? 700  : 400,
    fontStyle:       isItalic    ? 'italic' : 'normal',
    textDecoration:  isUnderline ? 'underline' : 'none',
    fontSize: 16, color: '#e0e0e0', padding: '8px 0',
  }

  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={() => send({ type: 'TOGGLE_BOLD' })}>
          <strong>B</strong>
        </Btn>
        <Btn onClick={() => send({ type: 'TOGGLE_ITALIC' })}>
          <em>I</em>
        </Btn>
        <Btn onClick={() => send({ type: 'TOGGLE_UNDERLINE' })}>
          <u>U</u>
        </Btn>
      </Row>
      <div style={sampleStyle as CSSProperties}>The quick brown fox jumps over the lazy dog.</div>
      <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>
        state.value = <code>{JSON.stringify(state.value)}</code>
      </div>
      <Info style={{ marginTop: 8 }}>
        Three parallel regions run independently. Each has its own on/off state.
        <code>state.value</code> is an object with all three regions simultaneously.
        No boolean flags in component state — the machine owns all formatting state.
      </Info>
    </div>
  )
}

export default function HierarchicalExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>06 · Hierarchical</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
        Compound states nest child states inside a parent. Parallel states run multiple
        independent regions simultaneously. Both allow <code>state.value</code> to be
        an object rather than a string.
      </p>

      <Section title="Compound States — Nested Loading Flow">
        <Info>
          <code>loading</code> is a compound state with children <code>idle</code> and
          <code>fetching</code>. Entering <em>loading</em> enters its <code>initial</code>
          child automatically. Use <code>#id.state</code> to target root states from within children.
        </Info>
        <CompoundDemo />
        <Pre>{`loading: {
  initial: 'idle',
  states: {
    idle:     { on: { START: 'fetching' } },
    fetching: { on: { SUCCESS: '#load.loaded' } },   // # targets root
  },
}`}</Pre>
      </Section>

      <Section title="Parent-Level Transitions">
        <Info>
          Events defined on a parent state apply to all child states without repetition.
          CANCEL on <em>filling</em> works regardless of which step is active.
        </Info>
        <WizardDemo />
        <Pre>{`filling: {
  on: { CANCEL: 'cancelled' },   // applies to step1, step2, step3
  initial: 'step1',
  states: { step1: {...}, step2: {...}, step3: {...} },
}`}</Pre>
      </Section>

      <Section title="Parallel States — Text Editor Formatting">
        <Info>
          <code>type: 'parallel'</code> runs all child regions simultaneously.
          Each region is an independent state machine. All regions are always active.
        </Info>
        <ParallelDemo />
        <Pre>{`editorMachine = createMachine({
  type: 'parallel',
  states: {
    bold:      { initial: 'off', states: { off: {...}, on: {...} } },
    italic:    { initial: 'off', states: { off: {...}, on: {...} } },
    underline: { initial: 'off', states: { off: {...}, on: {...} } },
  },
})`}</Pre>
      </Section>
    </div>
  )
}
