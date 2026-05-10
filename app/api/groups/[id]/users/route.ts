import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const { user_id } = await req.json()

  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('user_groups')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', user_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'User is already in this group' }, { status: 409 })
  }

  const { error } = await supabase
    .from('user_groups')
    .insert({ group_id: groupId, user_id })

  if (error) {
    return NextResponse.json({ error: 'Failed to add user to group' }, { status: 500 })
  }

  return NextResponse.json({ message: 'User added to group' }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const { user_id } = await req.json()

  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_groups')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user_id)

  if (error) {
    return NextResponse.json({ error: 'Failed to remove user from group' }, { status: 500 })
  }

  return NextResponse.json({ message: 'User removed from group' })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params

  const { data: members, error } = await supabase
    .from('user_groups')
    .select('user_id, users(id, email, role)')
    .eq('group_id', groupId)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch group members' }, { status: 500 })
  }

  return NextResponse.json(members)
}
