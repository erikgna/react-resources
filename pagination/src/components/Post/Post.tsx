import type { IPost } from "./types";

export default function Post({ post }: { post: IPost }) {
    return (
        <div style={{ marginBottom: "10px" }}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
        </div>
    );
}