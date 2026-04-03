import useSWRInfinite from "swr/infinite";
import { fetcher } from "./api";

export function Infinite() {
  // size is the number of pages that will be fetched and returned
  // setSize set the number of pages that need to be fetched
  const { data, size, setSize } = useSWRInfinite(
    (index) => `/api/users?page=${index + 1}`,
    fetcher,
    {
      parallel: true, // fetch pages in parallel
      initialSize: 10, // initial number of pages to fetch
    },
  );
  if (!data) return "loading";
  // We can now calculate the number of all users
  let totalUsers = 0;
  for (let i = 0; i < data.length; i++) {
    totalUsers += data[i].length;
  }

  return (
    <div>
      <p>{totalUsers} users listed</p>
      {data.map((users, index) => {
        // `data` is an array of each page's API response.
        return users.map((user) => <div key={user.id}>{user.name}</div>);
      })}
      <button onClick={() => setSize(size + 1)}>Load More</button>
    </div>
  );
}
