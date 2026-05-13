export default function AppNav({ html, state }) {
  const { attrs } = state
  const { active = '/' } = attrs

  const links = [
    { href: '/', label: 'Custom Elements' },
    { href: '/counter', label: 'Progressive Enhancement' },
    { href: '/data', label: 'SSR + Data' },
    { href: '/lifecycle', label: 'WC Lifecycle' },
  ]

  return html`
    <style>
      app-nav nav {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }
      app-nav a {
        padding: 8px 20px;
        border: 2px solid #6366f1;
        border-radius: 6px;
        text-decoration: none;
        color: #6366f1;
        font-weight: 600;
        font-size: 14px;
      }
      app-nav a.active-link {
        background: #6366f1;
        color: white;
      }
    </style>
    <nav>
      ${links.map(link => `
        <a href="${link.href}" class="${link.href === active ? 'active-link' : ''}">${link.label}</a>
      `).join('')}
    </nav>
  `
}
