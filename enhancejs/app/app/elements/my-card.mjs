export default function MyCard({ html, state }) {
  const { attrs } = state
  const { title = 'Card', body = '', type = 'info' } = attrs

  const colorMap = {
    info: '#6366f1',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
  }
  const color = colorMap[type] || colorMap.info

  return html`
    <style>
      my-card {
        display: block;
        margin-bottom: 12px;
      }
      my-card .card {
        border-radius: 8px;
        padding: 16px;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        border-left: 4px solid ${color};
      }
      my-card .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      my-card .card-title {
        font-size: 15px;
        font-weight: 700;
        color: ${color};
        margin: 0;
      }
      my-card .card-body {
        font-size: 13px;
        color: #4b5563;
        margin: 0;
        line-height: 1.5;
      }
    </style>
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${title}</h3>
        <my-badge label="${type}" color="${color}"></my-badge>
      </div>
      <p class="card-body">${body}</p>
    </div>
  `
}
