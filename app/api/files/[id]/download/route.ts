import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: file } = await supabase
    .from('files')
    .select('original_name, storage_path')
    .eq('id', id)
    .single()

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const { data, error } = await supabase.storage
    .from('files')
    .download(file.storage_path)

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
  }

  const buffer = Buffer.from(await data.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      'Content-Disposition': `attachment; filename="${file.original_name}"`,
      'Content-Type': 'application/octet-stream',
    },
  })
}
