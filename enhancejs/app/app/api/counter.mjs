import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Arc dev server reimports modules per request (serverless behavior).
// Module-level vars reset each invocation — use a file for persistent state.
const STATE = join(process.cwd(), '.counter.json')

function read() {
  try { return JSON.parse(readFileSync(STATE, 'utf8')).count || 0 } catch { return 0 }
}

function write(n) {
  writeFileSync(STATE, JSON.stringify({ count: n }))
}

export async function get() {
  return { json: { count: read() } }
}

export async function post(req) {
  const action = req.body?.action || 'increment'
  let count = read()

  if (action === 'increment') count++
  else if (action === 'decrement') count = Math.max(0, count - 1)
  else if (action === 'reset') count = 0

  write(count)

  const wantsJSON = req.headers?.accept?.includes('application/json')
  if (wantsJSON) return { json: { count } }

  return { location: '/counter' }
}
