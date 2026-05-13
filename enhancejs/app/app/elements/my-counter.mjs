export default function MyCounter({ html, state }) {
  const { count = 0 } = state.store

  return html`
    <style>
      my-counter {
        display: block;
        max-width: 400px;
      }
      my-counter .counter-display {
        font-size: 72px;
        font-weight: 700;
        text-align: center;
        color: #6366f1;
        padding: 24px;
        border: 3px solid #e0e7ff;
        border-radius: 12px;
        margin-bottom: 16px;
        background: white;
        font-family: monospace;
        transition: color 0.2s;
      }
      my-counter .counter-controls {
        display: flex;
        gap: 8px;
        justify-content: center;
      }
      my-counter button {
        padding: 10px 28px;
        border: none;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
        font-size: 20px;
        transition: opacity 0.15s;
      }
      my-counter button:hover { opacity: 0.85; }
      my-counter .btn-dec { background: #e0e7ff; color: #3730a3; }
      my-counter .btn-inc { background: #6366f1; color: white; }
      my-counter .btn-rst { background: #f3f4f6; color: #6b7280; font-size: 13px; padding: 10px 16px; }
      my-counter .js-status {
        margin-top: 12px;
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
      }
      my-counter .js-active {
        color: #059669;
        font-weight: 600;
        display: none;
      }
    </style>

    <div class="counter-display" id="count-display">${count}</div>

    <form method="POST" action="/counter" id="counter-form">
      <div class="counter-controls">
        <button class="btn-dec" name="action" value="decrement" type="submit">−</button>
        <button class="btn-rst" name="action" value="reset" type="submit">Reset</button>
        <button class="btn-inc" name="action" value="increment" type="submit">+</button>
      </div>
    </form>

    <div class="js-status">
      <span id="no-js-note">Works without JS — form POST</span>
      <span class="js-active" id="js-note">JS active — no page reload</span>
    </div>

    <script type="module">
      const form = document.getElementById('counter-form')
      const display = document.getElementById('count-display')
      const jsNote = document.getElementById('js-note')
      const noJsNote = document.getElementById('no-js-note')

      if (form && display) {
        jsNote.style.display = 'inline'
        noJsNote.style.display = 'none'

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          const action = e.submitter?.value || 'increment'

          const res = await fetch('/counter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            body: 'action=' + encodeURIComponent(action),
          })

          if (res.ok) {
            const data = await res.json().catch(() => null)
            if (data && typeof data.count === 'number') {
              display.textContent = data.count
            }
          }
        })
      }
    </script>
  `
}
