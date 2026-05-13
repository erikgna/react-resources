export default function MyLifecycle({ html, state }) {
  const { attrs } = state
  const { color = '#6366f1', label = 'Observe me' } = attrs

  return html`
    <style>
      my-lifecycle {
        display: block;
      }
      my-lifecycle .lc-display {
        padding: 20px;
        border-radius: 8px;
        border: 3px solid ${color};
        margin-bottom: 12px;
        text-align: center;
        font-size: 22px;
        font-weight: 700;
        color: ${color};
        background: white;
        transition: border-color 0.3s, color 0.3s;
      }
      my-lifecycle .lc-log {
        font-family: monospace;
        font-size: 12px;
        background: #1f2937;
        color: #d1fae5;
        border-radius: 6px;
        padding: 12px;
        max-height: 200px;
        overflow-y: auto;
        line-height: 1.6;
      }
      my-lifecycle .lc-log p { margin: 0; }
      my-lifecycle .ts { color: #6b7280; }
      my-lifecycle .ev-connected { color: #34d399; }
      my-lifecycle .ev-changed { color: #60a5fa; }
      my-lifecycle .ev-disconnected { color: #f87171; }
    </style>

    <div class="lc-display" id="lc-display">${label}</div>
    <div class="lc-log" id="lc-log">
      <p class="ev-connected"><span class="ts">[SSR]</span> Element rendered server-side — no JS ran yet</p>
    </div>

    <script type="module">
      class MyLifecycle extends HTMLElement {
        static observedAttributes = ['color', 'label']

        #appendLog(msg, cls = '') {
          const logEl = this.querySelector('#lc-log')
          if (!logEl) return
          const ts = new Date().toLocaleTimeString()
          const p = document.createElement('p')
          p.className = cls
          p.innerHTML = '<span class="ts">[' + ts + ']</span> ' + msg
          logEl.appendChild(p)
          logEl.scrollTop = logEl.scrollHeight
        }

        connectedCallback() {
          this.#appendLog('connectedCallback — element added to DOM', 'ev-connected')
        }

        disconnectedCallback() {
          // Element removed — log would go to a detached node but won't be visible
        }

        attributeChangedCallback(name, oldVal, newVal) {
          this.#appendLog(
            'attributeChangedCallback: <strong>' + name + '</strong> "' + oldVal + '" → "' + newVal + '"',
            'ev-changed'
          )

          const display = this.querySelector('#lc-display')
          if (!display) return

          if (name === 'color') {
            display.style.borderColor = newVal
            display.style.color = newVal
          }
          if (name === 'label') {
            display.textContent = newVal
          }
        }
      }

      customElements.define('my-lifecycle', MyLifecycle)
    </script>
  `
}
