import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const adminId = req.headers.get('x-user-id')
  const { name } = await req.json()

  if (!name) {
    return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
  }

  const { data: folder, error } = await supabase
    .from('folders')
    .insert({ name, created_by: adminId })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }

  return NextResponse.json(folder, { status: 201 })
}

export async function GET() {
  const { data: folders, error } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }

  return NextResponse.json(folders)
}
