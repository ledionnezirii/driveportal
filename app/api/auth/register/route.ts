import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
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

  return NextResponse.json({ token, user }, { status: 201 })
}
