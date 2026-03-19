export interface Post {
  id: number
  title: string
  body: string
  likes: number
  bookmarked: boolean
}

const posts: Post[] = [
  { id: 1, title: 'First Post', body: 'Content of the first post.', likes: 5, bookmarked: false },
  { id: 2, title: 'Second Post', body: 'Content of the second post.', likes: 3, bookmarked: false },
  { id: 3, title: 'Third Post', body: 'Content of the third post.', likes: 7, bookmarked: true },
]

export function getPosts(filter?: string | null): Post[] {
  if (!filter) return posts
  return posts.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()))
}

export function getPost(id: number): Post | undefined {
  return posts.find(p => p.id === id)
}

export function getRelatedPosts(id: number): Post[] {
  return posts.filter(p => p.id !== id)
}

export function likePost(id: number): Post | undefined {
  const post = posts.find(p => p.id === id)
  if (post) post.likes++
  return post
}

export function toggleBookmark(id: number): Post | undefined {
  const post = posts.find(p => p.id === id)
  if (post) post.bookmarked = !post.bookmarked
  return post
}
