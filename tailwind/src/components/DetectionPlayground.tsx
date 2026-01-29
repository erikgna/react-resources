import { useState } from "react";

export default function DetectionPlayground() {
    const [color, setColor] = useState("red");

    const staticClass = "bg-green-500 p-4 rounded-lg";

    // Tailwind sees "bg-blue-500" and "bg-purple-500" in this file and generates them.
    const colorMap: any = {
        red: "bg-red-500",
        blue: "bg-blue-500",
        purple: "bg-purple-500",
    };

    // Tailwind does NOT see the string "bg-orange-500". 
    // It only sees "bg-", which is not a valid utility.
    const brokenDynamicClass = `bg-${color}-500`;

    return (
        <div className="min-h-screen bg-white p-8 space-y-12 text-gray-900">
            <header className="border-b-2 border-gray-100 pb-4">
                <h1 className="text-2xl font-bold">Class Detection POC (v4)</h1>
                <p className="text-gray-500">Testing what the Tailwind scanner "sees"</p>
            </header>

            {/* 1. Static Detection */}
            <section className="space-y-4">
                <h2 className="font-semibold text-lg">1. Static Detection</h2>
                <div className={staticClass}>
                    This background works because the string is complete.
                </div>
            </section>

            {/* 2. Mapping Detection */}
            <section className="space-y-4">
                <h2 className="font-semibold text-lg">2. Mapping (The Right Way)</h2>
                <div className="flex gap-2">
                    {['red', 'blue', 'purple'].map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className="px-3 py-1 border rounded"
                        >
                            Set to {c}
                        </button>
                    ))}
                </div>
                <div className={`p-4 text-white transition-colors ${colorMap[color]}`}>
                    This works! Tailwind found <code className="bg-black/20 px-1">{colorMap[color]}</code> in the source code.
                </div>
            </section>

            {/* 3. Concatenation Failure */}
            <section className="space-y-4">
                <h2 className="font-semibold text-lg text-red-600">3. Concatenation (The Wrong Way)</h2>
                <div className={`p-4 border-2 border-dashed ${brokenDynamicClass}`}>
                    <p>Current class: <code className="font-bold">{brokenDynamicClass}</code></p>
                    <p className="text-sm mt-2">
                        <strong>Result:</strong> This box will have NO background color.
                        Tailwind's scanner does not run JavaScript, so it never sees the word "bg-red-500".
                    </p>
                </div>
            </section>

            {/* 4. Non-Standard Files */}
            <section className="space-y-4">
                <h2 className="font-semibold text-lg text-blue-600">4. Detection via @source</h2>
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm">
                        If this component were in a file called <code className="text-pink-600">Library.txt</code>
                        Tailwind wouldn't scan it by default. You would need:
                    </p>
                    <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs">
                        {`@source "./path/to/Library.txt";`}
                    </pre>
                </div>
            </section>
        </div>
    );
}