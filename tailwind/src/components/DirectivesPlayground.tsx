import { useState } from "react";

export default function DirectivesPlayground() {
  const [isSelected, setIsSelected] = useState(0);

  return (
    <div className="min-h-screen bg-black p-10 space-y-12 text-gray-300">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Directives & Functions POC</h1>
        <p className="text-gray-500">Testing @theme, @utility, @variant, and theme()</p>
      </header>

      {/* Test 1: @utility */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono text-neon-lime">@utility Test</h2>
        <div>
          <button className="btn-neon">
            Neon Action
          </button>
          <p className="mt-2 text-sm italic text-gray-600">
            This button uses a single class "btn-neon" but handles hover and transitions via CSS.
          </p>
        </div>
      </section>

      {/* Test 2: theme() function */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono text-neon-lime">theme() Function Test</h2>
        <div className="custom-card rounded-xl max-w-sm">
          <h3 className="text-white font-bold">Encapsulated Card</h3>
          <p className="text-sm mt-2">
            This card's background and padding are pulled from the Tailwind theme 
            using the <code>theme()</code> function inside a standard CSS class.
          </p>
        </div>
      </section>

      {/* Test 3: @variant (hocus) */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono text-neon-lime">@variant (Custom "hocus")</h2>
        <input 
          type="text" 
          placeholder="I change on hover OR focus..."
          className="bg-gray-900 border border-gray-700 p-2 rounded-lg w-full max-w-md
                     transition-colors outline-none
                     hocus:border-neon-lime hocus:ring-1 hocus:ring-neon-lime"
        />
      </section>

      {/* Test 4: @variant (Selector based) */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono text-neon-lime">@variant (Attribute based)</h2>
        <div className="flex gap-4">
          {[1, 2, 3].map((item) => (
            <div 
              key={item}
              onClick={() => setIsSelected(item)}
              data-selected={isSelected === item ? "true" : "false"}
              className="p-6 border-2 border-gray-800 rounded-lg cursor-pointer transition-all
                         selected:border-neon-lime selected:bg-neon-lime/10 selected:text-white"
            >
              Option {item}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 uppercase tracking-widest">
          Click a box to trigger the <code>selected:</code> variant
        </p>
      </section>
    </div>
  );
}