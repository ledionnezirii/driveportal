import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const adminOnlyPaths = ['/api/folders', '/api/files/upload', '/api/groups', '/api/permissions']

export async function middleware(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const user = payload as { id: string; email: string; role: string }

    const isAdminPath = adminOnlyPaths.some(path => req.nextUrl.pathname.startsWith(path))

    if (isAdminPath && user.role !== 'admin') {
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
  matcher: ['/api/folders/:path*', '/api/files/:path*', '/api/groups/:path*', '/api/permissions/:path*', '/api/dashboard/:path*'],
}
