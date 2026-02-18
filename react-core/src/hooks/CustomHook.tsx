import { useState, useEffect } from "react";

// A custom hook is simply a JavaScript function that starts with the prefix use and calls other hooks inside it. The primary purpose of a custom hook is to extract and share reusable logic, making components cleaner, more readable, and easier to maintain.
export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return width;
}