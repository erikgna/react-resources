import React, { useState, useEffect, useRef } from "react";

// This component watches a DOM element and reacts to internal changes.
export default function MutationObserverPOC() {
  const [items, setItems] = useState(["Initial Item"]);
  const [logs, setLogs] = useState<string[]>([]);

  // 1. The Ref for the element we want to observe
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 2. Define the Callback: What happens when a mutation occurs?
    const callback = (mutationList: MutationRecord[]) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          const added = mutation.addedNodes.length > 0 ? "Added" : "Removed";
          addLog(
            `Node ${added}! Total children: ${mutation.target.childNodes.length}`,
          );
        } else if (mutation.type === "attributes") {
          addLog(`Attribute '${mutation.attributeName}' changed on an item.`);
        } else if (mutation.type === "characterData") {
          addLog("Text content inside an item was modified.");
        }
      }
    };

    // 3. Initialize the Observer
    const observer = new MutationObserver(callback);

    // 4. Start Observing with specific options
    observer.observe(containerRef.current, {
      childList: true, // Watch for adding/removing children
      attributes: true, // Watch for style/class/attr changes
      subtree: true, // Watch descendants too, not just direct children
      characterData: true, // Watch for text changes
    });

    // Cleanup
    return () => observer.disconnect();
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5),
    );
  };

  const addItem = () => setItems([...items, `Item ${items.length + 1}`]);

  const toggleStyle = (e: React.MouseEvent<HTMLDivElement>) => {
    // Manually changing an attribute to trigger the observer
    const target = e.currentTarget;
    target.style.color = target.style.color === "red" ? "black" : "red";
  };

  return (
    <div className="p-6 max-w-2xl mx-auto flex gap-8">
      {/* Target Area */}
      <div className="flex-1">
        <h2 className="font-bold mb-4">Observed Container</h2>
        <button
          onClick={addItem}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Item (Trigger Mutation)
        </button>

        <div
          ref={containerRef}
          className="p-4 border-2 border-dashed border-blue-400 rounded bg-blue-50"
        >
          {items.map((item, i) => (
            <div
              key={i}
              onClick={toggleStyle}
              className="p-2 mb-2 bg-white border rounded cursor-pointer hover:shadow-sm"
              contentEditable // Allows us to trigger characterData mutations
              suppressContentEditableWarning
            >
              {item}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">
          Tip: Click an item to change color (Attribute) or type inside it
          (CharacterData).
        </p>
      </div>

      {/* Activity Log */}
      <div className="w-64">
        <h2 className="font-bold mb-4 text-red-600">Mutation Log</h2>
        <div className="text-sm font-mono bg-gray-900 text-green-400 p-3 rounded h-64 overflow-y-auto">
          {logs.length === 0 && (
            <span className="opacity-50">Waiting for changes...</span>
          )}
          {logs.map((log, i) => (
            <div key={i} className="mb-2 border-b border-gray-700 pb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
