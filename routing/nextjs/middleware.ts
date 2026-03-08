import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isAuthenticated = true

export function middleware(request: NextRequest) {
  if (!isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
