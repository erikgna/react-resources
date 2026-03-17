import { useState } from "react";

import Pagination from "./components/Pagination/Pagination";
import PostList from "./components/Post/PostList";
import InfiniteScrollPosts from "./components/InfiniteScrollPosts/InfiniteScrollPosts";

import { useClientPagination } from "./hooks/useClientPagination";
import { usePagination } from "./hooks/usePagination";

function ServerSidePagination() {
  const {
    posts,
    currentPage,
    totalPages,
    loading,
    nextPage,
    prevPage,
    goToPage,
  } = usePagination("posts/paginated", 20);

  return (
    <div className="p-4">
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <PostList posts={posts} />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        nextPage={nextPage}
        prevPage={prevPage}
        goToPage={goToPage}
      />
    </div>
  );
}

function ClientSidePagination() {
  const {
    posts,
    currentPage,
    totalPages,
    loading,
    nextPage,
    prevPage,
    goToPage,
  } = useClientPagination(20);

  return (
    <div className="p-4">
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <PostList posts={posts} />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        nextPage={nextPage}
        prevPage={prevPage}
        goToPage={goToPage}
      />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<"server" | "client" | "infinite">("server");

  return (
    <div>
      <div className="flex gap-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer" onClick={() => setView("server")}>Server Side Pagination</button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer" onClick={() => setView("client")}>Client Side Pagination</button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer" onClick={() => setView("infinite")}>Infinite Scroll</button>
      </div>
      {view === "server" && <ServerSidePagination />}
      {view === "client" && <ClientSidePagination />}
      {view === "infinite" && <InfiniteScrollPosts />}
    </div>
  );
}