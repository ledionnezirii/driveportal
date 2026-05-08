'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { SkeletonFile } from '@/components/ui/Skeleton'
import { Folder, FolderOpen, FileText, ChevronDown, ChevronUp } from 'lucide-react'

interface FileItem { id: string; original_name: string; folder_id: string; created_at: string }
interface FolderItem { id: string; name: string; created_at: string }

export default function DashboardPage() {
  const router = useRouter()
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await api.dashboard.get()
      setFiles(data.files || [])
      setFolders(data.folders || [])
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    if (localStorage.getItem('role') === 'admin') { router.push('/admin'); return }
    fetchDashboard()
  }, [fetchDashboard, router])

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

  // files that belong to an accessible folder
  const folderFiles = (folderId: string) => files.filter(f => f.folder_id === folderId)
  // files with individual access (not inside any accessible folder)
  const folderIds = new Set(folders.map(f => f.id))
  const individualFiles = files.filter(f => !folderIds.has(f.folder_id))

  const isEmpty = files.length === 0 && folders.length === 0

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
        ) : isEmpty ? (
          <div className="text-center py-24 text-gray-600">
            <FolderOpen size={52} className="mx-auto mb-4 opacity-25" />
            <p className="text-base font-medium">No files shared with you yet</p>
            <p className="text-sm mt-1">Contact your administrator to request access.</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Folders with files inside */}
            {folders.length > 0 && (
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Folders</h3>
                <div className="space-y-2">
                  {folders.map(folder => {
                    const fFiles = folderFiles(folder.id)
                    const isOpen = expandedFolder === folder.id
                    return (
                      <div key={folder.id} className="bg-gray-900 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedFolder(isOpen ? null : folder.id)}
                          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-800 transition text-left"
                        >
                          {isOpen ? <FolderOpen size={20} className="text-blue-400 shrink-0" /> : <Folder size={20} className="text-gray-400 shrink-0" />}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{folder.name}</p>
                            <p className="text-xs text-gray-500">{fFiles.length} file{fFiles.length !== 1 ? 's' : ''}</p>
                          </div>
                          {isOpen ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-800 divide-y divide-gray-800">
                            {fFiles.length === 0 ? (
                              <p className="text-sm text-gray-600 px-5 py-3">No files in this folder.</p>
                            ) : (
                              fFiles.map(file => (
                                <div key={file.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800 transition">
                                  <div className="flex items-center gap-3">
                                    <FileText size={15} className="text-gray-500 shrink-0" />
                                    <span className="text-sm text-gray-300">{file.original_name}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    loading={downloading === file.id}
                                    onClick={() => handleDownload(file.id, file.original_name)}
                                    className="px-3! py-1.5! text-xs"
                                  >
                                    {downloading === file.id ? 'Downloading...' : 'Download'}
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Individual files (direct file permissions) */}
            {individualFiles.length > 0 && (
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Files</h3>
                <div className="space-y-2">
                  {individualFiles.map(file => (
                    <div key={file.id} className="bg-gray-900 hover:bg-gray-800 transition rounded-xl px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-gray-500 shrink-0" />
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
            )}
          </div>
        )}
      </main>
    </div>
  )
}
