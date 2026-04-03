import { Suspense } from "react";
import useSWR from "swr";
import { fetcher } from "./api";

function Profile() {
  const { data } = useSWR("/api/user", fetcher, { suspense: true });
  return <div>hello, {data.name}</div>;
}

function SuspenseDemo() {
  return (
    <ErrorBoundary fallback={<h2>Could not fetch posts.</h2>}>
      <Suspense fallback={<h1>Loading posts...</h1>}>
        <Profile />
      </Suspense>
    </ErrorBoundary>
  );
}
