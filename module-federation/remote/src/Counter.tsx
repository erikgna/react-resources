import { useState } from 'react'

// Exposed via module federation — state lives inside the remote bundle.
// Each time the host mounts this component it gets its own isolated state,
// proving that the remote's React state is separate from the host's.
export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Remote counter: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  )
}

export default Counter
