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

  const { data: userGroups } = await supabase
    .from('user_groups')
    .select('group_id')
    .eq('user_id', userId)

  const groupIds = userGroups?.map(ug => ug.group_id) ?? []

  const { data: permission } = await supabase
    .from('permissions')
    .select('id')
    .eq('file_id', id)
    .or(`user_id.eq.${userId}${groupIds.length > 0 ? `,group_id.in.(${groupIds.join(',')})` : ''}`)
    .single()

  if (!permission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: file } = await supabase
    .from('files')
    .select('original_name, storage_path')
    .eq('id', id)
    .single()

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: file.storage_path,
  })

  const s3Response = await s3.send(command)
  const buffer = Buffer.from(await s3Response.Body!.transformToByteArray())

  return new NextResponse(buffer, {
    headers: {
      'Content-Disposition': `attachment; filename="${file.original_name}"`,
      'Content-Type': 'application/octet-stream',
    },
  })
}
