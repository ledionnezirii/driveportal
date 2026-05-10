import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase
    .from('permissions')
    .select('group_id, groups(name)')
    .eq('folder_id', id)
    .not('group_id', 'is', null)
  if (error) return NextResponse.json({ error: 'Failed to fetch folder permissions' }, { status: 500 })
  return NextResponse.json(data)
}

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: folderFiles } = await supabase
    .from('files')
    .select('id, storage_path')
    .eq('folder_id', id)

  if (folderFiles && folderFiles.length > 0) {
    await Promise.all(
      folderFiles.map(file =>
        s3.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: file.storage_path,
        }))
      )
    )

    await supabase.from('files').delete().eq('folder_id', id)
  }

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Folder deleted' })
}
