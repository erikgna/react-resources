import React, { useState } from "react";

export default function CSPPOC() {
  const [status, setStatus] = useState("Waiting for interaction...");

  // This will be BLOCKED if 'unsafe-inline' is not allowed in script-src
  const triggerInlineEval = () => {
    try {
      // eval is the poster child for CSP blocks
      eval("alert('If you see this, CSP is NOT blocking eval!')");
    } catch (e) {
      setStatus("Blocked: eval() was stopped by CSP.");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto border-2 border-red-200 rounded-xl bg-white shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-red-700">CSP Security POC</h2>

      <div className="space-y-6">
        {/* Case 1: Trusted Image */}
        <section>
          <h3 className="font-semibold text-gray-700">
            1. Trusted Source (Self)
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            This image is hosted on the same origin.
          </p>
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
            ✓
          </div>
        </section>

        {/* Case 2: Blocked Image */}
        <section>
          <h3 className="font-semibold text-gray-700">
            2. Unauthorized External Image
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            If CSP is working, this random URL should fail to load.
          </p>
          <img
            src="https://evil-tracker.com/pixel.png"
            alt="Blocked Image"
            className="border border-dashed border-gray-300 p-2 text-xs"
            onError={() => console.log("CSP Blocked the external image!")}
          />
        </section>

        {/* Case 3: Blocked Execution */}
        <section>
          <h3 className="font-semibold text-gray-700">
            3. Unsafe Inline Execution
          </h3>
          <button
            onClick={triggerInlineEval}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Try Unsafe Eval()
          </button>
          <p className="mt-2 text-sm font-mono text-red-500">{status}</p>
        </section>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-600">
        <strong>Check your Browser Console (F12):</strong>
        Look for "Refused to load..." or "Refused to execute..." errors.
      </div>
    </div>
  );
}
