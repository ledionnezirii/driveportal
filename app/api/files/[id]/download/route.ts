import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { supabase } from '@/lib/supabase'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = req.headers.get('x-user-id')!
  const userRole = req.headers.get('x-user-role')

  const { data: file } = await supabase
    .from('files')
    .select('original_name, storage_path, folder_id')
    .eq('id', id)
    .single()

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  if (userRole !== 'admin') {
    const { data: userGroups } = await supabase
      .from('user_groups')
      .select('group_id')
      .eq('user_id', userId)

    const groupIds = userGroups?.map(ug => ug.group_id) ?? []

    const [
      { data: directFilePerm },
      { data: directFolderPerm },
    ] = await Promise.all([
      supabase.from('permissions').select('id').eq('file_id', id).eq('user_id', userId).maybeSingle(),
      supabase.from('permissions').select('id').eq('folder_id', file.folder_id).eq('user_id', userId).maybeSingle(),
    ])

    let groupFilePerm = null
    let groupFolderPerm = null
    if (groupIds.length > 0) {
      const [{ data: gfp }, { data: gfolp }] = await Promise.all([
        supabase.from('permissions').select('id').eq('file_id', id).in('group_id', groupIds).maybeSingle(),
        supabase.from('permissions').select('id').eq('folder_id', file.folder_id).in('group_id', groupIds).maybeSingle(),
      ])
      groupFilePerm = gfp
      groupFolderPerm = gfolp
    }

    if (!directFilePerm && !directFolderPerm && !groupFilePerm && !groupFolderPerm) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: file.storage_path,
  })

  const s3Response = await s3.send(command)
  const buffer = Buffer.from(await s3Response.Body!.transformToByteArray())

  const safeFilename = file.original_name.replace(/[\r\n"]/g, '')

  return new NextResponse(buffer, {
    headers: {
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Content-Type': 'application/octet-stream',
    },
  })
}
