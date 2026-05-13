import { getStyles } from '@enhance/arc-plugin-styles'

export default function Head(state) {
  const { store = {} } = state
  const { pageTitle = 'Enhance POC' } = store

  const styles = process.env.ARC_LOCAL
    ? getStyles.linkTag()
    : getStyles.styleTag()

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${pageTitle}</title>
      ${styles}
      <link rel="icon" href="/_public/favicon.svg">
      <style>
        *, *::before, *::after { box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: #f1f5f9;
          margin: 0;
          padding: 0;
          color: #111827;
        }
        .poc-wrap {
          max-width: 720px;
          margin: 0 auto;
          padding: 32px 24px;
        }
        h1 { font-size: 22px; margin: 0 0 4px; }
        .subtitle { font-size: 14px; color: #6b7280; margin: 0 0 24px; }
        .section-label {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 24px 0 8px;
        }
      </style>
    </head>
  `
}
