import React, { useState, useEffect, useRef } from "react";

// Sticky header that hides on scroll using IntersectionObserver
// Sentinel div at top of page — when it leaves viewport, header hides

export default function StickyHideOnScroll() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Sentinel visible = user at top = show header
        // Sentinel gone = user scrolled down = hide header
        setIsHeaderVisible(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
      },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      {/* Sentinel: sits at top of scroll container, observer watches this */}
      <div ref={sentinelRef} className="h-1 w-full" />

      {/* Sticky header */}
      <header
        className={[
          "sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-6 py-4",
          "transition-transform duration-300 ease-in-out",
          isHeaderVisible ? "translate-y-0" : "-translate-y-full",
        ].join(" ")}
      >
        <h1 className="text-lg font-bold text-gray-800">Sticky Header POC</h1>
        <p className="text-xs text-gray-500">
          IntersectionObserver — hides on scroll
        </p>
      </header>

      {/* Scrollable content */}
      <main className="max-w-md mx-auto p-6 space-y-4">
        <p className="text-sm text-gray-600">
          Scroll down — header hides. Scroll back to top — header returns.
        </p>
        {Array.from({ length: 40 }, (_, i) => (
          <div
            key={i}
            className="p-4 bg-white border border-gray-200 rounded shadow-sm"
          >
            Content block {i + 1}
          </div>
        ))}
      </main>
    </div>
  );
}
