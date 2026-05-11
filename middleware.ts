import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const adminOnlyPaths = ['/api/folders', '/api/files/upload', '/api/groups', '/api/permissions', '/api/users']
const adminOnlyMethods = ['DELETE', 'PUT', 'PATCH']

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const user = payload as { id: string; email: string; role: string }

    const pathname = req.nextUrl.pathname
    const isFilesListRoute = pathname === '/api/files' && req.method === 'GET'
    const isAdminPath = adminOnlyPaths.some(path => pathname.startsWith(path)) || isFilesListRoute
    const isAdminMethod = adminOnlyMethods.includes(req.method)

    if ((isAdminPath || isAdminMethod) && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', user.role)

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/api/folders', '/api/folders/:path*', '/api/files', '/api/files/:path*', '/api/groups', '/api/groups/:path*', '/api/permissions', '/api/permissions/:path*', '/api/dashboard/:path*', '/api/users', '/api/users/:path*'],
}
