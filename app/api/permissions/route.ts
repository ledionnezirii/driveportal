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
