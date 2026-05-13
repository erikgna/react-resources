export default function MyFrameworkList({ html, state }) {
  const { frameworks = [] } = state.store

  const rows = frameworks.map(f => `
    <tr>
      <td class="fw-name">${f.name}</td>
      <td class="fw-type">${f.type}</td>
      <td class="fw-year">${f.year}</td>
      <td class="fw-ssr">${f.ssr ? 'Yes' : 'No'}</td>
    </tr>
  `).join('')

  const empty = `<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:24px">No data</td></tr>`

  return html`
    <style>
      my-framework-list {
        display: block;
      }
      my-framework-list table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      my-framework-list th {
        background: #1f2937;
        color: #9ca3af;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 10px 16px;
        text-align: left;
        font-weight: 600;
      }
      my-framework-list td {
        padding: 12px 16px;
        border-bottom: 1px solid #f3f4f6;
        font-size: 14px;
        color: #374151;
      }
      my-framework-list tr:last-child td { border-bottom: none; }
      my-framework-list .fw-name { font-weight: 700; color: #111827; }
      my-framework-list .fw-type { color: #6366f1; font-family: monospace; font-size: 13px; }
      my-framework-list .fw-year { color: #9ca3af; }
      my-framework-list .fw-ssr { color: #059669; font-weight: 600; }
    </style>
    <table>
      <thead>
        <tr>
          <th>Framework</th>
          <th>Rendering Model</th>
          <th>Year</th>
          <th>SSR Native</th>
        </tr>
      </thead>
      <tbody>
        ${rows || empty}
      </tbody>
    </table>
  `
}
