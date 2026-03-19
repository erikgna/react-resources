import { Post } from "generated/prisma/client";

export interface PaginatedResponse {
    posts: Post[];
    meta: {
        currentPage: number;
        totalPages: number;
    };
}