import { useLocalStorage } from "./useLocalStorage";
import { useSessionStorage } from "./useSessionStorage";

export function Storage() {
  const [value, setValue] = useLocalStorage("test", "hello");
  const [value2, setValue2] = useSessionStorage("test2", "hello2");

  return (
    <div>
      <h1>Local Storage</h1>
      <button onClick={() => setValue("hello5")}>{value}</button>

      <h1>Session Storage</h1>
      <button onClick={() => setValue2("hello25")}>{value2}</button>
      <button onClick={() => window.open("http://localhost:5173")}>
        New Tab
      </button>
    </div>
  );
}
