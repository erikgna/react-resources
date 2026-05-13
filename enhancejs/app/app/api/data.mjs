const frameworks = [
  { name: 'React',    type: 'VDOM + Reconciler',       year: 2013, ssr: true  },
  { name: 'Svelte',   type: 'Compiled Reactivity',      year: 2016, ssr: true  },
  { name: 'SolidJS',  type: 'Fine-Grained Signals',     year: 2019, ssr: true  },
  { name: 'Enhance',  type: 'SSR Web Components',        year: 2022, ssr: true  },
  { name: 'Vue',      type: 'VDOM + Composition API',   year: 2014, ssr: true  },
  { name: 'Angular',  type: 'Zone.js + Change Detection', year: 2016, ssr: true },
  { name: 'Preact',   type: 'VDOM (lightweight)',        year: 2015, ssr: true  },
  { name: 'Lit',      type: 'Web Components (client)',   year: 2019, ssr: false },
]

export async function get() {
  return { json: { frameworks } }
}
