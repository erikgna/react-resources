export default function ResponsivePlayground() {
  return (
    <div className="min-h-screen p-6 space-y-10 bg-gray-50 text-gray-900">
      <h1 className="text-2xl font-bold">Responsive & Container Queries – POC</h1>

      {/* Mobile-first */}
      <section className="space-y-2">
        <h2 className="font-semibold">Mobile-first</h2>
        <div className="p-4 rounded-xl bg-blue-200 sm:bg-green-200 md:bg-yellow-200 lg:bg-purple-200">
          <p className="font-medium">Resize viewport</p>
          <p className="text-sm">
            Base styles apply to mobile, enhancements layer up.
          </p>
        </div>
      </section>

      {/* Custom breakpoints */}
      <section className="space-y-2">
        <h2 className="font-semibold">Custom breakpoints</h2>
        <div className="p-4 rounded-xl bg-gray-200 tablet:bg-orange-200 desktop:bg-red-200">
          <p className="font-medium">tablet / desktop</p>
          <p className="text-sm">Uses non-default breakpoints</p>
        </div>
      </section>

      {/* Container queries */}
      <section className="space-y-2">
        <h2 className="font-semibold">Container queries</h2>

        <div className="resize-x overflow-auto max-w-full border rounded-xl p-4">
          <div className="@container">
            <div
              className="p-4 rounded-xl bg-indigo-200
                         @sm:bg-indigo-300
                         @md:bg-indigo-400"
            >
              <p className="font-medium">Resize this container</p>
              <p className="text-sm">
                Styles respond to container size, not viewport
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Container + layout */}
      <section className="space-y-2">
        <h2 className="font-semibold">Container-driven layout</h2>

        <div className="@container border rounded-xl p-4">
          <div className="grid gap-4 @md:grid-cols-2">
            <div className="p-3 rounded-lg bg-gray-200">Card A</div>
            <div className="p-3 rounded-lg bg-gray-300">Card B</div>
          </div>
        </div>
      </section>
    </div>
  );
}
