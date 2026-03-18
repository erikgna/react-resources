import { http, HttpResponse } from 'msw'

const posts = [
  { id: 1, title: 'Post 1', body: 'Body content for post 1.' },
  { id: 2, title: 'Post 2', body: 'Body content for post 2.' },
  { id: 3, title: 'Post 3', body: 'Body content for post 3.' },
]

export const handlers = [
  http.get('/posts', (info) => {
    const filter = new URL(info.request.url).searchParams.get('filter')?.toLowerCase()
    const result = filter ? posts.filter(p => p.title.toLowerCase().includes(filter)) : posts
    return HttpResponse.json(result)
  }),
  http.get('/posts/:id/related', (info) => {
    const id = Number(info.params.id)
    return HttpResponse.json(posts.filter(p => p.id !== id))
  }),
  http.get('/posts/:id', (info) => {
    const post = posts.find(p => p.id === Number(info.params.id))
    if (!post) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(post)
  }),
]
