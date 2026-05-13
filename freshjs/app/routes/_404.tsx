import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div style={{ padding: "24px", fontFamily: "system-ui, sans-serif" }}>
        <h1>404 — Page not found</h1>
        <a href="/" style={{ color: "#6366f1" }}>Back to home</a>
      </div>
    </>
  );
}
