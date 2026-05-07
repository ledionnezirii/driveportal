import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { supabase } from '@/lib/supabase'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

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

  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: file.storage_path,
  }))

  const { error } = await supabase.from('files').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }

  return NextResponse.json({ message: 'File deleted' })
}
