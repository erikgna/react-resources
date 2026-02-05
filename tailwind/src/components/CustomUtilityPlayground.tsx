export default function CustomUtilityPlayground() {
    return (
      <div className="min-h-screen bg-slate-950 p-10 space-y-16 text-slate-200">
        <header>
          <h1 className="text-3xl font-bold text-white">Custom Utility POC</h1>
          <p className="text-slate-400">Testing @utility directive behavior in v4</p>
        </header>
  
        {/* Test 1: Complex CSS Utility */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-l-4 border-purple-500 pl-3">
            2. Complex CSS Logic
          </h2>
          <div className="relative h-96 w-64 bg-slate-800 rounded-lg overflow-hidden">
            <div className="mask-fade-bottom p-4">
              <p className="text-slate-400">
                This text fades out at the bottom because of the custom 
                <code>mask-fade-bottom</code> utility. It uses a linear 
                gradient mask that is hard to do with standard utilities.
              </p>
              <p className="mt-4 text-slate-400">
                Tailwind v4 makes this reusable without needing to 
                write a plugin or use messy arbitrary values everywhere.
              </p>
            </div>
          </div>
        </section>
  
        {/* Test 2: Functional Utility with Arbitrary Values */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-l-4 border-yellow-500 pl-3">
            3. Functional Utilities (Dynamic)
          </h2>
          <div className="flex gap-8">
            <div className="h-32 w-48 overflow-y-scroll bg-slate-900 border border-slate-700 p-2 scrollbar-w-4px">
               <div className="h-64 bg-linear-to-b from-yellow-500 to-transparent p-2">
                 Custom Scrollbar (4px)
               </div>
            </div>
  
            <div className="h-32 w-48 overflow-y-scroll bg-slate-900 border border-slate-700 p-2 scrollbar-w-12px">
               <div className="h-64 bg-linear-to-b from-yellow-500 to-transparent p-2">
                 Custom Scrollbar (12px)
               </div>
            </div>
          </div>
          <p className="text-sm text-slate-500 italic">
            Uses <code>scrollbar-w-[value]</code> which maps to <code>--value</code> in CSS.
          </p>
        </section>
      </div>
    );
  }