import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { name } = await req.json()

  if (!name) {
    return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
  }

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }

  return NextResponse.json(group, { status: 201 })
}

export async function GET() {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }

  return NextResponse.json(groups)
}
