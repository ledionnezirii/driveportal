import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Remove memberships and permissions before deleting the group
  await supabase.from('user_groups').delete().eq('group_id', id)
  await supabase.from('permissions').delete().eq('group_id', id)

  const { error } = await supabase.from('groups').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
