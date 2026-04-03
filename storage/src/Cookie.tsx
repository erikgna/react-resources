import { useCookie } from "./useCookies";

export function Cookie() {
  const [value, setValue] = useCookie("test", "hello");

  return (
    <div>
      <h1>Cookie</h1>
      <button onClick={() => setValue("hello5")}>{value}</button>
    </div>
  );
}
