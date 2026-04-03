import useSWRInfinite from "swr/infinite";
import { mutate } from "swr";

import { useUser } from "./hooks/useUser";
import { usePosts } from "./hooks/usePosts";
import { useUpdateUser } from "./hooks/useUpdateUser";
import { prefetchUser } from "./prefetch";
import { fetcher } from "./api";

function Avatar({ userId }: { userId: string }) {
  const { user, isLoading, isError } = useUser(userId);

  if (isLoading) return <p>Loading user...</p>;
  if (isError) return <p>Error loading user</p>;

  if (!user) return null;

  return (
    <div>
      <img src={user.avatar} width={80} />
      <p>{user.name}</p>
      <small>{user.updatedAt}</small>
    </div>
  );
}

function UserName({ userId }: { userId: string }) {
  const { user } = useUser(userId);
  return <h2>{user?.name}</h2>;
}

function RefreshButton({ userId }: { userId: string }) {
  const { mutate } = useUser(userId);
  return <button onClick={() => mutate()}>Refresh</button>;
}

function UpdateName({ userId }: { userId: string }) {
  const { user, mutate } = useUser(userId);

  async function update() {
    const newName = "Optimistic Name";

    mutate({ ...user, name: newName }, false);

    await new Promise((r) => setTimeout(r, 1000));

    mutate();
  }

  return <button onClick={update}>Optimistic Update</button>;
}

function UpdateWithMutation() {
  const { trigger, isMutating } = useUpdateUser();

  return (
    <button
      onClick={() => trigger({ name: "Mutation Name" })}
      disabled={isMutating}
    >
      {isMutating ? "Updating..." : "Update via Mutation"}
    </button>
  );
}

function UserPosts({ userId }: { userId: string }) {
  const { data } = usePosts(userId);

  if (!data) return <p>Loading posts...</p>;

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

function PrefetchDemo() {
  return (
    <button onMouseEnter={() => prefetchUser("1")}>
      Hover to Prefetch User
    </button>
  );
}

function GlobalRefresh() {
  return (
    <button onClick={() => mutate(["/api/user", "1"])}>Global Refresh</button>
  );
}

function InfiniteUsers() {
  const { data, size, setSize } = useSWRInfinite(
    (index) => `/api/users?page=${index + 1}`,
    fetcher,
  );

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      {data.flat().map((user: any) => (
        <p key={user.id}>{user.name}</p>
      ))}

      <button onClick={() => setSize(size + 1)}>Load More</button>
    </div>
  );
}

function ErrorExample() {
  const { isError } = useUser("error");

  if (isError) return <p>Error with retry...</p>;

  return null;
}

export default function App() {
  return (
    <div>
      <h1>SWR POC</h1>

      <Avatar userId="1" />
      <UserName userId="1" />

      <RefreshButton userId="1" />
      <UpdateName userId="1" />
      <UpdateWithMutation />

      <UserPosts userId="1" />

      <PrefetchDemo />
      <GlobalRefresh />

      <InfiniteUsers />

      <ErrorExample />
    </div>
  );
}
