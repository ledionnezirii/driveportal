import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!

  const { data: userGroups } = await supabase
    .from('user_groups')
    .select('group_id')
    .eq('user_id', userId)

  const groupIds = userGroups?.map(ug => ug.group_id) ?? []

  const { data: permissions } = await supabase
    .from('permissions')
    .select('file_id, folder_id')
    .or(
      `user_id.eq.${userId}${groupIds.length > 0 ? `,group_id.in.(${groupIds.join(',')})` : ''}`
    )

  if (!permissions || permissions.length === 0) {
    return NextResponse.json({ folders: [], files: [] })
  }

  const fileIds = [...new Set(permissions.filter(p => p.file_id).map(p => p.file_id))]
  const folderIds = [...new Set(permissions.filter(p => p.folder_id).map(p => p.folder_id))]

  const [filesResult, foldersResult, folderFilesResult] = await Promise.all([
    fileIds.length > 0
      ? supabase.from('files').select('id, original_name, folder_id, created_at').in('id', fileIds)
      : { data: [] },
    folderIds.length > 0
      ? supabase.from('folders').select('id, name, created_at').in('id', folderIds)
      : { data: [] },
    folderIds.length > 0
      ? supabase.from('files').select('id, original_name, folder_id, created_at').in('folder_id', folderIds)
      : { data: [] },
  ])

  const directFiles = filesResult.data ?? []
  const folderFiles = folderFilesResult.data ?? []

  // merge files, avoid duplicates (file might have both direct + folder permission)
  const allFileIds = new Set(directFiles.map(f => f.id))
  const mergedFiles = [
    ...directFiles,
    ...folderFiles.filter(f => !allFileIds.has(f.id)),
  ]

  return NextResponse.json({
    folders: foldersResult.data ?? [],
    files: mergedFiles,
  })
}
