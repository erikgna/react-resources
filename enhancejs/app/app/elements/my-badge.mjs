export default function MyBadge({ html, state }) {
  const { attrs } = state
  const { label = 'badge', color = '#6366f1' } = attrs

  return html`
    <style>
      my-badge {
        display: inline-block;
      }
      my-badge span {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 99px;
        font-size: 11px;
        font-weight: 700;
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    </style>
    <span style="background: ${color}">${label}</span>
  `
}
