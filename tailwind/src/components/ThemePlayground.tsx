export default function ThemePlayground() {
    return (
        <div className="min-h-screen bg-gray-50 p-8 space-y-12 text-gray-900">
            <header className="border-b pb-4">
                <h1 className="text-3xl font-bold">Tailwind v4 Theme Engine POC</h1>
                <p className="text-gray-600">Testing CSS-variable driven design tokens</p>
            </header>

            {/* Concept 1: Namespacing & Extending */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">1. Namespacing & Extending</h2>
                <div className="flex gap-4 items-center">
                    {/* bg-brand-primary is generated from --color-brand-primary */}
                    <div className="h-16 w-16 bg-brand-primary rounded-full shadow-lg" />
                    <div>
                        <p className="text-brand-primary font-bold">Custom Brand Color</p>
                        <p className="text-sm text-gray-500">Utility: <code className="bg-gray-200 px-1 text-pink-600">bg-brand-primary</code></p>
                    </div>
                </div>
                {/* font-display is generated from --font-display */}
                <p className="font-display text-4xl">This uses a custom Display font</p>
            </section>

            {/* Concept 2: Overriding Defaults */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">2. Overriding Defaults</h2>
                <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <p>The <code className="text-blue-600 font-mono">rounded-xl</code> class was overridden in CSS to be 2rem.</p>
                    <button className="mt-4 px-4 py-2 bg-black text-white rounded-xl">
                        Overridden Radius
                    </button>
                </div>
            </section>

            {/* Concept 3: Concentric Radii with calc() */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">3. Calc() & Theme Variables</h2>
                <div className="inline-block p-4 bg-gray-900 rounded-xl">
                    {/* We use var() to reference the theme token inside an arbitrary value */}
                    <div className="bg-white p-4 rounded-[calc(var(--radius-xl)-12px)]">
                        <p className="text-sm font-medium">Concentric Border Radius</p>
                        <p className="text-xs text-gray-500">Inner radius = xl - 12px</p>
                    </div>
                </div>
            </section>

            {/* Concept 4: Custom Animations */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">4. Custom Keyframes</h2>
                <div className="animate-float inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-xl">
                    I am floating!
                </div>
                <p className="text-sm text-gray-500">Utility: <code className="bg-gray-200 px-1 text-pink-600">animate-float</code></p>
            </section>

            {/* Concept 5: Spacing Scale */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">5. Custom Spacing</h2>
                <div className="bg-green-100 p-huge border-2 border-dashed border-green-500">
                    <p className="text-center font-mono">p-huge (8rem padding)</p>
                </div>
            </section>
        </div>
    );
}