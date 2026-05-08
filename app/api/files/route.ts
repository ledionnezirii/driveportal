import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: files, error } = await supabase
    .from('files')
    .select('id, original_name, folder_id, folders(name)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }

  return NextResponse.json(files)
}
