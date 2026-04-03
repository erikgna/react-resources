import React, { useState, useEffect, useRef } from "react";

export type Item = {
  id: string;
  content: string;
};

export default function IntersectionObserverPOC() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Create a Ref for the element we want to "watch"
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Mock function to simulate an API call
  const fetchMoreItems = (pageNum: number) => {
    setIsLoading(true);
    setTimeout(() => {
      const newItems = Array.from({ length: 10 }, (_, i) => ({
        id: `${pageNum}-${i}`,
        content: `Loaded Item ${pageNum * 10 + i}`,
      }));
      setItems((prev) => [...prev, ...newItems]);
      setIsLoading(false);
    }, 800); // Artificial delay
  };

  // 2. Setup the Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        // If the loader div is visible and we aren't already loading...
        if (target.isIntersecting && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      {
        root: null, // use the browser viewport
        rootMargin: "20px", // start loading 20px before the element is visible
        threshold: 0.1, // trigger when 10% of the element is visible
      },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    // Cleanup: Stop observing when component unmounts
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [isLoading]); // Re-run if loading state changes to ensure we don't double-trigger

  // Fetch data when page changes
  useEffect(() => {
    fetchMoreItems(page);
  }, [page]);

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Infinite Scroll POC</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-white border border-gray-200 rounded shadow-sm"
          >
            {item.content}
          </div>
        ))}
      </div>

      {/* 3. The "Sentinel" element - we watch this to trigger logic */}
      <div
        ref={loaderRef}
        className="h-20 flex items-center justify-center mt-4 border-2 border-dashed border-gray-300 rounded"
      >
        {isLoading ? (
          <span className="text-blue-500 animate-pulse">
            Loading more items...
          </span>
        ) : (
          <span className="text-gray-400">Scroll down to load more</span>
        )}
      </div>
    </div>
  );
}
