import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { file_id, folder_id, user_id, group_id } = await req.json()

  if (!file_id && !folder_id) {
    return NextResponse.json({ error: 'file_id or folder_id is required' }, { status: 400 })
  }

  if (!user_id && !group_id) {
    return NextResponse.json({ error: 'user_id or group_id is required' }, { status: 400 })
  }

  // check if permission already exists
  let query = supabase.from('permissions').select('id')
  if (file_id) query = query.eq('file_id', file_id)
  if (folder_id) query = query.eq('folder_id', folder_id)
  if (user_id) query = query.eq('user_id', user_id)
  if (group_id) query = query.eq('group_id', group_id)

  const { data: existing } = await query.maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Permission already exists' }, { status: 409 })
  }

  const { data: permission, error } = await supabase
    .from('permissions')
    .insert({ file_id, folder_id, user_id, group_id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 })
  }

  return NextResponse.json(permission, { status: 201 })
}
