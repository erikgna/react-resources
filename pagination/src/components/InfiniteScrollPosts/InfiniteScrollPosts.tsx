import { useEffect, useRef, useState } from "react";
import type { IPost } from "../Post/types";
import Post from "../Post/Post";

export default function InfiniteScrollPosts() {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const observerRef = useRef<HTMLDivElement | null>(null);

    async function fetchPosts(pageNumber: number) {
        setLoading(true);

        const res = await fetch(`http://localhost:3000/posts/paginated?page=${pageNumber}&limit=20`);
        const data = await res.json();

        setPosts((prev) => [...prev, ...data.posts]);
        setTotalPages(Number(data.meta.totalPages));

        setLoading(false);
    }

    useEffect(() => {
        fetchPosts(page);
    }, [page]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // entries is an array of observed elements (we only use one)
                const entry = entries[0];

                // When the element is fully visible (based on threshold)
                // AND we're not currently loading
                // AND there are more pages to fetch
                if (entry.isIntersecting && !loading && page < totalPages) {
                    // Increment page → triggers new data fetch
                    setPage((prev) => prev + 1);
                }
            },
            {
                // threshold: 1 means the element must be 100% visible
                threshold: 1,
            }
        );

        const current = observerRef.current;
        if (current) observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        };
    }, [loading, page, totalPages]);

    return (
        <div>
            {posts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-md p-4">
                    <Post post={post} />
                </div>
            ))}

            {loading && <p>Loading...</p>}

            <div ref={observerRef} style={{ height: "20px" }} />
        </div>
    );
}