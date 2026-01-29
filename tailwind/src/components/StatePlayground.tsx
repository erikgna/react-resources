import React from "react";

/**
 * Tailwind State Playground
 * POC component to visually test hover, focus, active, disabled,
 * group-hover, peer, and dark mode states.
 *
 * Assumes Tailwind is already installed and configured.
 */
export default function StatePlayground() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-bold mb-6">Tailwind States – POC</h1>

            {/* Hover & Active */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Hover / Active</h2>
                <button className="px-4 py-2 rounded-xl bg-blue-600 text-white shadow transition
                           hover:bg-blue-700 active:scale-95">
                    Hover / Active me
                </button>
            </section>

            {/* Focus & Focus-visible */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Focus</h2>
                <input
                    placeholder="Focus me (tab / click)"
                    className="px-3 py-2 rounded-lg border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus-visible:ring-4"
                />
            </section>

            {/* Disabled */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Disabled</h2>
                <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-gray-400 text-white
                     cursor-not-allowed opacity-60"
                >
                    Disabled button
                </button>
            </section>

            {/* Group Hover */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Group Hover</h2>
                <div className="group p-4 rounded-xl border border-gray-300 hover:border-blue-500">
                    <p className="text-sm">Hover the card</p>
                    <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition">
                        Appears on hover
                    </span>
                </div>
            </section>

            {/* Peer */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Peer</h2>
                <label className="flex items-center gap-2">
                    <input type="checkbox" className="peer hidden" />
                    <div className="w-5 h-5 rounded border border-gray-400
                          peer-checked:bg-green-500" />
                    <span className="peer-checked:text-green-600">
                        Check me
                    </span>
                </label>
            </section>

            {/* Dark mode */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Dark mode</h2>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow">
                    <p className="text-gray-700 dark:text-gray-300">
                        Toggle <code>dark</code> class on <code>html</code>
                    </p>
                </div>
            </section>

            {/* Loading / aria */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">ARIA states</h2>
                <button
                    aria-busy="true"
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white
                     aria-busy:opacity-50 aria-busy:cursor-wait"
                >
                    Busy button
                </button>
            </section>

            {/* Pseudo-elements */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Pseudo-elements</h2>
                <button className="relative px-4 py-2 rounded-xl bg-indigo-600 text-white
                       before:content-[''] before:absolute before:inset-0
                       before:rounded-xl before:bg-indigo-800 before:opacity-0
                       hover:before:opacity-20">
                    Hover with ::before
                </button>
            </section>

            {/* Media queries */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Media queries (responsive)</h2>
                <div className="p-4 rounded-xl bg-red-200 sm:bg-yellow-200 md:bg-green-200 lg:bg-blue-200">
                    Resize viewport (sm / md / lg)
                </div>
            </section>

            {/* Feature queries */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Feature queries</h2>
                <div className="p-4 rounded-xl bg-gray-200 supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:backdrop-blur">
                    Uses @supports(backdrop-filter)
                </div>
            </section>

            {/* Child selectors */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Child selectors</h2>
                <ul className="p-4 rounded-xl border space-y-2 [&>li]:px-2 [&>li]:py-1 [&>li]:rounded
                       [&>li:nth-child(odd)]:bg-gray-200 [&>li:nth-child(even)]:bg-gray-300">
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                </ul>
            </section>

            {/* Custom variants */}
            <section className="mb-8">
                <h2 className="font-semibold mb-2">Custom variants</h2>
                <p className="text-sm mb-2">Requires a custom variant in tailwind.config.js</p>
                <div className="p-4 rounded-xl bg-gray-300 data-[state=error]:bg-red-400" data-state="error">
                    data-state="error"
                </div>
            </section>
        </div>
    );
}
