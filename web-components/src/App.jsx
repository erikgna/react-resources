import { useEffect, useRef } from "react";

export default function App() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;

    const handler = (e) => {
      console.log("New value:", e.detail.value);
    };

    el.addEventListener("count-change", handler);

    return () => {
      el.removeEventListener("count-change", handler);
    };
  }, []);

  return (
    <div>
      <h1>React + Web Component</h1>

      <custom-counter ref={ref} initial="5"></custom-counter>
    </div>
  );
}