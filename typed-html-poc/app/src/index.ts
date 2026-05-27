import { Hono } from 'hono'
import { exp01 } from './routes/exp01'
import { exp02 } from './routes/exp02'
import { exp03 } from './routes/exp03'
import { exp04 } from './routes/exp04'
import { exp05 } from './routes/exp05'
import { exp06 } from './routes/exp06'
import { exp07Get, exp07Post } from './routes/exp07'
import { exp08 } from './routes/exp08'
import { exp09 } from './routes/exp09'
import { exp10 } from './routes/exp10'

const app = new Hono()

const PORT = 3002

app.use('*', async (c, next) => {
  const start = performance.now()
  await next()
  const ms = (performance.now() - start).toFixed(2)
  console.log(`[${c.req.method}] ${c.req.path} ${c.res.status} ${ms}ms`)
})

app.get('/', (c) => c.html(`
  <html><body>
    <h1>typed-html POC</h1>
    <ul>
      <li><a href="/exp01">exp01 — Basic Elements</a></li>
      <li><a href="/exp02">exp02 — Attribute Serialization</a></li>
      <li><a href="/exp03">exp03 — Conditional Rendering</a></li>
      <li><a href="/exp04">exp04 — List Rendering</a></li>
      <li><a href="/exp05">exp05 — Custom Components</a></li>
      <li><a href="/exp06">exp06 — Layout Composition</a></li>
      <li><a href="/exp07">exp07 — Form + POST</a></li>
      <li><a href="/exp08">exp08 — XSS Probe</a></li>
      <li><a href="/exp09">exp09 — Benchmark</a></li>
      <li><a href="/exp10">exp10 — Mini-SSR Framework</a></li>
    </ul>
  </body></html>
`))

app.get('/exp01', (c) => c.html(exp01()))
app.get('/exp02', (c) => c.html(exp02()))
app.get('/exp03', (c) => {
  const show = c.req.query('show') !== 'false'
  return c.html(exp03(show))
})
app.get('/exp04', (c) => c.html(exp04()))
app.get('/exp05', (c) => c.html(exp05()))
app.get('/exp06', (c) => c.html(exp06()))
app.get('/exp07', (c) => c.html(exp07Get()))
app.post('/exp07', async (c) => {
  const body = await c.req.parseBody()
  const name = typeof body['name'] === 'string' ? body['name'] : ''
  return c.html(exp07Post(name))
})
app.get('/exp08', (c) => {
  const input = c.req.query('input') ?? '<script>alert(1)</script>'
  return c.html(exp08(input))
})
app.get('/exp09', async (c) => {
  const result = await exp09()
  return c.json(result)
})
app.get('/exp10', (c) => c.html(exp10()))

console.log(`[server] listening on :${PORT}`)
export default { port: PORT, fetch: app.fetch }
