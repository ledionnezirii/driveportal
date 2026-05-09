'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { SkeletonFile } from '@/components/ui/Skeleton'
import { Folder, FolderOpen, FileText, ChevronDown, Download, LogOut } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

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

  const folderFiles = (folderId: string) => files.filter(f => f.folder_id === folderId)
  const folderIds = new Set(folders.map(f => f.id))
  const individualFiles = files.filter(f => !folderIds.has(f.folder_id))
  const isEmpty = files.length === 0 && folders.length === 0

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={30} />
          <h1 className="text-xl font-bold tracking-tight">DrivePortal</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">My Files</h2>
          {!loading && !isEmpty && (
            <p className="text-sm text-gray-500 mt-1">
              {folders.length > 0 && `${folders.length} folder${folders.length !== 1 ? 's' : ''}`}
              {folders.length > 0 && individualFiles.length > 0 && ' · '}
              {individualFiles.length > 0 && `${individualFiles.length} file${individualFiles.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <SkeletonFolder />
            <SkeletonFolder />
            <SkeletonFile />
          </div>
        ) : isEmpty ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/4 border border-white/8 mb-4">
              <FolderOpen size={32} className="text-gray-600" />
            </div>
            <p className="text-base font-medium text-gray-400">No files shared with you yet</p>
            <p className="text-sm text-gray-600 mt-1">Contact your administrator to request access.</p>
          </div>
        ) : (
          <div className="space-y-8">

            {folders.length > 0 && (
              <section>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Folder size={11} />
                  Folders
                </h3>
                <div className="space-y-2">
                  {folders.map(folder => {
                    const fFiles = folderFiles(folder.id)
                    const isOpen = expandedFolder === folder.id
                    return (
                      <div key={folder.id} className="bg-white/4 rounded-xl overflow-hidden border border-white/8 transition-colors">
                        <button
                          type="button"
                          onClick={() => setExpandedFolder(isOpen ? null : folder.id)}
                          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors text-left"
                        >
                          {isOpen
                            ? <FolderOpen size={20} className="text-blue-400 shrink-0" />
                            : <Folder size={20} className="text-gray-400 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{folder.name}</p>
                            <p className="text-xs text-gray-500">{fFiles.length} file{fFiles.length !== 1 ? 's' : ''}</p>
                          </div>
                          <ChevronDown
                            size={15}
                            className={`text-gray-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>

                        <div className={`grid transition-all duration-200 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                          <div className="overflow-hidden">
                            <div className="border-t border-white/6 divide-y divide-white/6">
                              {fFiles.length === 0 ? (
                                <p className="text-sm text-gray-600 px-5 py-4">No files in this folder.</p>
                              ) : (
                                fFiles.map(file => (
                                  <div key={file.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/4 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <FileText size={15} className="text-gray-500 shrink-0" />
                                      <span className="text-sm text-gray-300 truncate">{file.original_name}</span>
                                    </div>
                                    <Button
                                      type="button"
                                      loading={downloading === file.id}
                                      onClick={() => handleDownload(file.id, file.original_name)}
                                      className="px-3! py-1.5! text-xs shrink-0 ml-3"
                                    >
                                      {downloading === file.id ? 'Downloading…' : (
                                        <span className="flex items-center gap-1.5">
                                          <Download size={12} />
                                          Download
                                        </span>
                                      )}
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {individualFiles.length > 0 && (
              <section>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={11} />
                  Files
                </h3>
                <div className="space-y-2">
                  {individualFiles.map(file => (
                    <div
                      key={file.id}
                      className="bg-white/4 hover:bg-white/6 transition-colors rounded-xl px-5 py-4 flex items-center justify-between border border-white/8"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={18} className="text-gray-500 shrink-0" />
                        <span className="text-sm font-medium truncate">{file.original_name}</span>
                      </div>
                      <Button
                        type="button"
                        loading={downloading === file.id}
                        onClick={() => handleDownload(file.id, file.original_name)}
                        className="px-4! py-2! text-xs shrink-0 ml-3"
                      >
                        {downloading === file.id ? 'Downloading…' : (
                          <span className="flex items-center gap-1.5">
                            <Download size={13} />
                            Download
                          </span>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function SkeletonFolder() {
  return (
    <div className="bg-white/4 rounded-xl px-5 py-4 border border-white/6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-white/10 rounded" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-36 bg-white/10 rounded" />
          <div className="h-2 w-14 bg-white/6 rounded" />
        </div>
        <div className="w-3 h-3 bg-white/6 rounded" />
      </div>
    </div>
  )
}
