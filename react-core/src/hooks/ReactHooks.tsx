import {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
// Introduced in React 16.8, hooks solved the problem of not being able to use state or side effects in functional components, which previously required class components. They are built-in functions provided by React to "hook into" its features.
export default function HooksExample() {
    const [count, setCount] = useState(0);

    // reference to DOM element to access the DOM element
    const inputRef = useRef<HTMLInputElement>(null);

    // side effect to handle side effects like data fetching, subscriptions, or manually changing the DOM
    useEffect(() => {
        console.log("Component mounted or count changed");

        return () => {
            console.log("Cleanup before next effect or unmount");
        };
    }, [count]);

    // memoized derived value to avoid re-calculating the value on every render
    const doubled = useMemo(() => {
        console.log("Calculating doubled");
        return count * 2;
    }, [count]);

    // memoized function to avoid re-rendering the function on every render
    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div>
            <h2>Count: {count}</h2>
            <h3>Doubled: {doubled}</h3>

            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>

            <br /><br />

            <input ref={inputRef} placeholder="Click focus button" />
            <button onClick={focusInput}>
                Focus Input
            </button>
        </div>
    );
}
