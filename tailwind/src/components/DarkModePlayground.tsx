import { useEffect, useState } from "react";

export default function DarkModePlayground() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  return (
    <div className="min-h-screen p-6 space-y-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dark Mode – POC</h1>
        <button
          onClick={() => setDark((v) => !v)}
          className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700"
        >
          Toggle dark mode
        </button>
      </div>

      {/* Basic dark */}
      <section className="space-y-2">
        <h2 className="font-semibold">Basic dark variant</h2>
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
          <p className="text-sm">Background and text switch</p>
        </div>
      </section>

      {/* Dark hover */}
      <section className="space-y-2">
        <h2 className="font-semibold">Dark + hover</h2>
        <button
          className="px-4 py-2 rounded-xl bg-blue-600 text-white
                     hover:bg-blue-700
                     dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          Hover me
        </button>
      </section>

      {/* Dark opt-out */}
      <section className="space-y-2">
        <h2 className="font-semibold">Opt-out of dark</h2>
        <div className="p-4 rounded-xl bg-white text-black dark:[background:white] dark:text-[black]">
          This block ignores dark mode
        </div>
      </section>

      {/* Media dark */}
      <section className="space-y-2">
        <h2 className="font-semibold">Media dark (prefers-color-scheme)</h2>
        <div className="p-4 rounded-xl bg-gray-200 dark:bg-gray-800 md:dark:bg-purple-800">
          Combines media + dark
        </div>
      </section>

      {/* Forced light */}
      <section className="space-y-2">
        <h2 className="font-semibold">Forced light inside dark</h2>
        <div className="dark">
          <div className="p-4 rounded-xl bg-white text-black dark:bg-white dark:text-black">
            Always light
          </div>
        </div>
      </section>
    </div>
  );
}
