import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const adminId = req.headers.get('x-user-id')
  const formData = await req.formData()

  const file = formData.get('file') as File
  const folderId = formData.get('folder_id') as string

  if (!file || !folderId) {
    return NextResponse.json({ error: 'File and folder_id are required' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const storagePath = `${folderId}/${Date.now()}_${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(storagePath, buffer, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }

  const { data: fileRecord, error: dbError } = await supabase
    .from('files')
    .insert({
      folder_id: folderId,
      original_name: file.name,
      storage_path: storagePath,
      uploaded_by: adminId,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
  }

  return NextResponse.json(fileRecord, { status: 201 })
}
