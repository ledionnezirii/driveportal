import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const adminOnlyApiPaths = ['/api/folders', '/api/files/upload', '/api/groups', '/api/permissions', '/api/users']
const adminOnlyMethods = ['DELETE', 'PUT', 'PATCH']

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const pathname = req.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api/')
  const isAdminPage = pathname.startsWith('/admin')

  if (!token) {
    if (isApiRoute) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const user = payload as { id: string; email: string; role: string }

    if (isAdminPage && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (isApiRoute) {
      const isFilesListRoute = pathname === '/api/files' && req.method === 'GET'
      const isAdminPath = adminOnlyApiPaths.some(path => pathname.startsWith(path)) || isFilesListRoute
      const isAdminMethod = adminOnlyMethods.includes(req.method)

      if ((isAdminPath || isAdminMethod) && user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', user.role)

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    if (isApiRoute) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/folders',
    '/api/folders/:path*',
    '/api/files',
    '/api/files/:path*',
    '/api/groups',
    '/api/groups/:path*',
    '/api/permissions',
    '/api/permissions/:path*',
    '/api/dashboard/:path*',
    '/api/users',
    '/api/users/:path*',
  ],
}
