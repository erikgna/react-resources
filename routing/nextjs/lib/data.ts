export interface Post {
  id: number
  title: string
  body: string
  likes: number
}

const posts: Post[] = [
  { id: 1, title: 'First Post', body: 'Content of the first post.', likes: 5 },
  { id: 2, title: 'Second Post', body: 'Content of the second post.', likes: 3 },
  { id: 3, title: 'Third Post', body: 'Content of the third post.', likes: 7 },
]

export function getPosts(filter?: string): Post[] {
  if (!filter) return posts
  return posts.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()))
}

export function getPost(id: number): Post | undefined {
  return posts.find(p => p.id === id)
}

export function likePost(id: number): Post | undefined {
  const post = posts.find(p => p.id === id)
  if (post) post.likes++
  return post
}
