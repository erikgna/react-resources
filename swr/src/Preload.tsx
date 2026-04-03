import useSWR, { preload } from "swr";
import { fetcher } from "./api";
import { useEffect, useState } from "react";

// Preload the resource before rendering the User component below,
// this prevents potential waterfalls in your application.
// You can also start preloading when hovering the button or link, too.
preload("/api/user", fetcher);

function User() {
  const { data } = useSWR("/api/user", fetcher);
}

// or can be used programmatically

function App({ userId }) {
  const [show, setShow] = useState(false);
  // preload in effects
  useEffect(() => {
    preload("/api/user?id=" + userId, fetcher);
  }, [userId]);

  return (
    <div>
      <button
        onClick={() => setShow(true)}
        onMouseEnter={() => preload("/api/user?id=" + userId, fetcher)}
      >
        Show User
      </button>
      {show ? <User /> : null}
    </div>
  );
}
