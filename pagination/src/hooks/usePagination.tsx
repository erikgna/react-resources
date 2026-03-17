import { useEffect, useState } from "react";

interface Post {
  id: number;
  title: string;
  content: string;
  published: boolean;
}

export function usePagination(endpoint: string, limit = 20, additionalParams: string = "") {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);

      const res = await fetch(
        `http://localhost:3000/${endpoint}?page=${currentPage}&limit=${limit}&${additionalParams}`
      );

      const data = await res.json();

      setPosts(data.posts);
      setTotalPages(Number(data.meta.totalPages));

      setLoading(false);
    }

    fetchPosts();
  }, [currentPage, limit]);

  const nextPage = () => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return {
    posts,
    currentPage,
    totalPages,
    loading,
    nextPage,
    prevPage,
    goToPage,
  };
}