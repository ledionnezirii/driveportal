import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const password_hash = await hashPassword(password)
  const userRole = 'user'

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password_hash, role: userRole })
    .select('id, email, role')
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })

  const response = NextResponse.json({ user }, { status: 201 })
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
