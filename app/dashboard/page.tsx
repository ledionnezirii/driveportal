'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { SkeletonFile } from '@/components/ui/Skeleton'

interface FileItem { id: string; original_name: string; folder_id: string; created_at: string }
interface FolderItem { id: string; name: string; created_at: string }

export default function DashboardPage() {
  const router = useRouter()
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    if (localStorage.getItem('role') === 'admin') { router.push('/admin'); return }
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      const data = await api.dashboard.get()
      setFiles(data.files || [])
      setFolders(data.folders || [])
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(fileId: string, fileName: string) {
    setDownloading(fileId)
    try {
      const res = await api.files.download(fileId)
      if (!res.ok) { alert('You do not have access to this file'); return }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
    } finally {
      setDownloading(null)
    }
  }

  function handleLogout() {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">DrivePortal</h1>
        <button type="button" onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">
          Sign out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-8">My Files</h2>

        {loading ? (
          <div className="space-y-2">
            <SkeletonFile /><SkeletonFile /><SkeletonFile />
          </div>
        ) : (
          <>
            {folders.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Folders</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {folders.map(folder => (
                    <div key={folder.id} className="bg-gray-900 rounded-xl p-4 flex items-center gap-3">
                      <span className="text-2xl">📁</span>
                      <span className="text-sm font-medium truncate">{folder.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {files.length === 0 && folders.length === 0 ? (
              <div className="text-center py-24 text-gray-600">
                <p className="text-5xl mb-4">📂</p>
                <p className="text-base font-medium">No files shared with you yet</p>
                <p className="text-sm mt-1">Contact your administrator to request access.</p>
              </div>
            ) : files.length > 0 ? (
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Files</h3>
                <div className="space-y-2">
                  {files.map(file => (
                    <div key={file.id} className="bg-gray-900 hover:bg-gray-800 transition rounded-xl px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <span className="text-sm font-medium">{file.original_name}</span>
                      </div>
                      <Button
                        type="button"
                        loading={downloading === file.id}
                        onClick={() => handleDownload(file.id, file.original_name)}
                        className="!px-4 !py-2 text-xs"
                      >
                        {downloading === file.id ? 'Downloading...' : 'Download'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
