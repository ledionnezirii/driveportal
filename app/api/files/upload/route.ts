import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { supabase } from '@/lib/supabase'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

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

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: storagePath,
    Body: buffer,
    ContentType: file.type,
  }))

  const { data: fileRecord, error } = await supabase
    .from('files')
    .insert({
      folder_id: folderId,
      original_name: file.name,
      storage_path: storagePath,
      uploaded_by: adminId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
  }

  return NextResponse.json(fileRecord, { status: 201 })
}
