import { useEffect, useState } from "react";

interface Post {
  id: number;
  title: string;
  content: string;
  published: boolean;
}

export function useClientPagination(limit = 20) {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);

      const res = await fetch("http://localhost:3000/posts");
      const data = await res.json();
      const posts = data.posts;

      setAllPosts(posts);

      const pages = Math.ceil(posts.length / limit);
      setTotalPages(pages);

      setLoading(false);
    }

    fetchPosts();
  }, [limit]);

  useEffect(() => {
    const start = (currentPage - 1) * limit;
    const end = start + limit;

    setPosts(allPosts.slice(start, end));
  }, [currentPage, allPosts, limit]);

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