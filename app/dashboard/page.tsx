'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Folder, FolderOpen, FileText, Download, LogOut, Users, ChevronRight, ChevronLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

interface FileItem { id: string; original_name: string; folder_id: string; created_at: string }
interface FolderItem { id: string; name: string; created_at: string }
interface GroupItem { id: string; name: string }
type View = 'home' | 'folders' | 'folder-detail' | 'groups'

export default function DashboardPage() {
  const router = useRouter()
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [view, setView] = useState<View>('home')
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await api.dashboard.get()
      setFiles(data.files || [])
      setFolders(data.folders || [])
      setGroups(data.groups || [])
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const role = localStorage.getItem('role')
    if (!role) { router.push('/login'); return }
    if (role === 'admin') { router.push('/admin'); return }
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

  async function handleLogout() {
    await api.auth.logout()
    localStorage.removeItem('role')
    router.push('/login')
  }

  const folderIds = new Set(folders.map(f => f.id))
  const filesInFolder = (folderId: string) => files.filter(f => f.folder_id === folderId)

  function openFolder(folder: FolderItem) {
    setSelectedFolder(folder)
    setView('folder-detail')
  }

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <button
              type="button"
              onClick={() => view === 'folder-detail' ? setView('folders') : setView('home')}
              title="Go back"
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors mr-1"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <Logo size={30} />
          <h1 className="text-xl font-bold tracking-tight">DrivePortal</h1>
          {view !== 'home' && (
            <>
              <span className="text-gray-600 hidden sm:inline">/</span>
              <span className="text-sm text-gray-300 hidden sm:inline">
                {view === 'folders' && 'Folders'}
                {view === 'folder-detail' && selectedFolder?.name}
                {view === 'groups' && 'Groups'}
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* HOME VIEW — two big cards */}
        {view === 'home' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold">My Portal</h2>
              <p className="text-sm text-gray-500 mt-1">Select a section to browse your content</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setView('folders')}
                  className="group bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/16 rounded-2xl p-7 text-left transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:bg-blue-500/20 transition-colors">
                    <Folder size={22} className="text-blue-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Folders</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {folders.length} folder{folders.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setView('groups')}
                  className="group bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/16 rounded-2xl p-7 text-left transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center mb-5 group-hover:bg-purple-500/20 transition-colors">
                    <Users size={22} className="text-purple-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Groups</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {groups.length === 0 ? 'No groups' : `${groups.length} group${groups.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </button>
              </div>
            )}
          </>
        )}

        {/* FOLDERS VIEW — list of folders + loose files */}
        {view === 'folders' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Folders</h2>
              <p className="text-sm text-gray-500 mt-0.5">{folders.length} folder{folders.length !== 1 ? 's' : ''}</p>
            </div>

            {folders.length === 0 ? (
              <EmptyState message="No folders shared with you yet" />
            ) : (
              <div className="space-y-2">
                {folders.map(folder => {
                  const count = filesInFolder(folder.id).length
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => openFolder(folder)}
                      className="group w-full flex items-center gap-4 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/16 rounded-xl px-5 py-4 text-left transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                        <Folder size={18} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{folder.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{count} file{count !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* FOLDER DETAIL VIEW — files inside a folder */}
        {view === 'folder-detail' && selectedFolder && (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <FolderOpen size={18} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{selectedFolder.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {filesInFolder(selectedFolder.id).length} file{filesInFolder(selectedFolder.id).length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {filesInFolder(selectedFolder.id).length === 0 ? (
              <EmptyState message="No files in this folder yet" />
            ) : (
              <div className="space-y-2">
                {filesInFolder(selectedFolder.id).map(file => (
                  <FileRow key={file.id} file={file} downloading={downloading} onDownload={handleDownload} />
                ))}
              </div>
            )}
          </>
        )}

        {/* GROUPS VIEW */}
        {view === 'groups' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Groups</h2>
              <p className="text-sm text-gray-500 mt-0.5">Groups you have been assigned to</p>
            </div>

            {groups.length === 0 ? (
              <EmptyState message="You haven't been assigned to any groups yet" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map(g => (
                  <div key={g.id} className="flex items-center gap-4 bg-white/4 border border-white/8 rounded-xl px-5 py-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                      <Users size={18} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{g.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Group member</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

function FileRow({ file, downloading, onDownload }: {
  file: FileItem
  downloading: string | null
  onDownload: (id: string, name: string) => void
}) {
  return (
    <div className="flex items-center gap-4 bg-white/4 hover:bg-white/6 border border-white/8 rounded-xl px-5 py-3.5 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-white/6 flex items-center justify-center shrink-0">
        <FileText size={16} className="text-gray-400" />
      </div>
      <span className="text-sm font-medium text-gray-200 truncate flex-1">{file.original_name}</span>
      <Button
        type="button"
        loading={downloading === file.id}
        onClick={() => onDownload(file.id, file.original_name)}
        className="px-3! py-1.5! text-xs shrink-0"
      >
        {downloading === file.id ? 'Downloading…' : (
          <span className="flex items-center gap-1.5">
            <Download size={12} />
            Download
          </span>
        )}
      </Button>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/4 border border-white/8 mb-4">
        <FolderOpen size={26} className="text-gray-600" />
      </div>
      <p className="text-sm font-medium text-gray-400">{message}</p>
      <p className="text-xs text-gray-600 mt-1">Contact your administrator to request access.</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-8 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-white/8 mb-5" />
      <div className="h-4 w-24 bg-white/8 rounded mb-2" />
      <div className="h-3 w-16 bg-white/6 rounded" />
    </div>
  )
}
