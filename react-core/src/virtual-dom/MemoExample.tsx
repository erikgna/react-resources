import React, { useState } from 'react';

// React.memo is a higher-order component for functional components that prevents re-renders if the props haven't changed.
const DisplayCounter = React.memo(({ count }: { count: number }) => {
    console.log('DisplayCounter rendered');
    return <h2>Count: {count}</h2>;
});

export function MemoExample() {
    const [count, setCount] = useState(0);
    const [text, setText] = useState('');

    return (
        <div>
            <DisplayCounter count={count} />
            <button onClick={() => setCount(count + 1)}>Increment</button>
            <input
                type="text"
                placeholder="Type something"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>
    );
}
