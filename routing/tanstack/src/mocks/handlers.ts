import { http, HttpResponse } from 'msw'
 
export const handlers = [
  http.get('/posts', () => {
    return HttpResponse.json({
      posts: [
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' },
        { id: 3, title: 'Post 3' },
      ],
    })
  }),
]