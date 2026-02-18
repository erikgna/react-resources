import React, { useState } from "react";

const Child = React.memo(({ onClick }: { onClick: () => void }) => {
  console.log("Child re-rendered");
  return <button onClick={onClick}>Click me</button>;
});

export function InlineExample() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log("Clicked");
  };

  return (
    <div>
      <p>Count: {count}</p>

      {/* New function created on every render */}
      <Child onClick={() => console.log("Clicked")} />

      {/* Pass a function reference instead of an inline function to avoid re-rendering the child component */}
      <Child onClick={handleClick} />

      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
