import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const adminOnlyPaths = ['/api/folders', '/api/files/upload', '/api/groups', '/api/permissions']

export function middleware(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = verifyToken(token)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdminPath = adminOnlyPaths.some(path => req.nextUrl.pathname.startsWith(path))

  if (isAdminPath && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', user.id)
  requestHeaders.set('x-user-role', user.role)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/api/folders/:path*', '/api/files/:path*', '/api/groups/:path*', '/api/permissions/:path*', '/api/dashboard/:path*'],
}
