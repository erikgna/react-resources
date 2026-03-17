import type { IPost } from "./types";

import Post from "./Post";

export default function PostList({ posts }: { posts: IPost[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {posts.map((post) => (
        <div key={post.id} className="border border-gray-200 rounded-md p-4">
          <Post post={post} />
        </div>
      ))}
    </div>
  );
}