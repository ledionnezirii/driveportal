import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: file } = await supabase
    .from('files')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  await supabase.storage.from('files').remove([file.storage_path])

  const { error } = await supabase.from('files').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }

  return NextResponse.json({ message: 'File deleted' })
}
