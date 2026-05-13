export default async function Preflight({ req }) {
  return {
    pageTitle: getPageTitle(req.path)
  }
}

function getPageTitle(path) {
  const titles = {
    '/': 'Custom Elements | Enhance POC',
    '/counter': 'Progressive Enhancement | Enhance POC',
    '/data': 'SSR + Data | Enhance POC',
    '/lifecycle': 'WC Lifecycle | Enhance POC',
  }
  return titles[path] || 'Enhance POC'
}
