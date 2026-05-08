'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { SkeletonRow } from '@/components/ui/Skeleton'

interface FolderItem { id: string; name: string }
interface UserItem { id: string; email: string; role: string }
interface FileItem { id: string; original_name: string; folder_id: string; folders?: { name: string } }

export default function AdminPage() {
  const router = useRouter()
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [folderName, setFolderName] = useState('')
  const [uploadFolderId, setUploadFolderId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [permFileId, setPermFileId] = useState('')
  const [permUserId, setPermUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)
  const [activeTab, setActiveTab] = useState<'folders' | 'upload' | 'permissions'>('folders')

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    if (localStorage.getItem('role') !== 'admin') { router.push('/dashboard'); return }
    fetchAll()
  }, [])

  async function fetchAll() {
    setDataLoading(true)
    try {
      const [fData, uData, filesData] = await Promise.all([
        api.folders.list(),
        api.users.list(),
        api.files.list(),
      ])
      setFolders(fData)
      setUsers(uData)
      setFiles(filesData)
    } catch {
      showToast('Failed to load data', false)
    } finally {
      setDataLoading(false)
    }
  }

  async function createFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!folderName.trim()) return
    setLoading(true)
    try {
      await api.folders.create(folderName)
      setFolderName('')
      showToast('Folder created!', true)
      fetchAll()
    } catch {
      showToast('Failed to create folder', false)
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile || !uploadFolderId) return
    setLoading(true)
    try {
      await api.files.upload(uploadFolderId, selectedFile)
      setSelectedFile(null)
      const input = document.querySelector<HTMLInputElement>('input[type="file"]')
      if (input) input.value = ''
      showToast('File uploaded successfully!', true)
      fetchAll()
    } catch {
      showToast('Upload failed', false)
    } finally {
      setLoading(false)
    }
  }

  async function grantPermission(e: React.FormEvent) {
    e.preventDefault()
    if (!permFileId || !permUserId) return
    setLoading(true)
    try {
      await api.permissions.grant({ file_id: permFileId, user_id: permUserId })
      showToast('Access granted!', true)
      setPermFileId('')
      setPermUserId('')
    } catch {
      showToast('Failed to grant access', false)
    } finally {
      setLoading(false)
    }
  }

  async function deleteFolder(id: string) {
    if (!confirm('Delete this folder and all its files?')) return
    await api.folders.delete(id)
    fetchAll()
  }

  function showToast(text: string, ok: boolean) {
    setToast({ text, ok })
  }

  function handleLogout() {
    localStorage.clear()
    router.push('/login')
  }

  const tabs = [
    { key: 'folders', label: 'Folders' },
    { key: 'upload', label: 'Upload File' },
    { key: 'permissions', label: 'Permissions' },
  ] as const

  const inputClass = 'w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600'
  const labelClass = 'block text-xs text-gray-400 uppercase tracking-wider mb-1.5'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">DrivePortal</h1>
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <button type="button" onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">
          Sign out
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {toast && (
          <Toast message={toast.text} ok={toast.ok} onDone={() => setToast(null)} />
        )}

        <div className="flex gap-1 mb-8 bg-gray-900 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.key ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'folders' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-4">Create Folder</h2>
              <form onSubmit={createFolder} className="flex gap-3">
                <input
                  type="text"
                  value={folderName}
                  onChange={e => setFolderName(e.target.value)}
                  placeholder="e.g. Q4 Reports"
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                />
                <Button type="submit" loading={loading} disabled={!folderName.trim()}>
                  Create
                </Button>
              </form>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-4">
                All Folders
                <span className="ml-2 text-xs text-gray-500 font-normal">{folders.length} total</span>
              </h2>
              {dataLoading ? (
                <div className="space-y-2">
                  <SkeletonRow /><SkeletonRow /><SkeletonRow />
                </div>
              ) : folders.length === 0 ? (
                <div className="text-center py-10 text-gray-600">
                  <p className="text-3xl mb-2">📁</p>
                  <p className="text-sm">No folders yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {folders.map(folder => (
                    <div key={folder.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📁</span>
                        <div>
                          <p className="text-sm font-medium">{folder.name}</p>
                          <p className="text-xs text-gray-600 font-mono">{folder.id}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => deleteFolder(folder.id)}
                        className="text-xs text-red-500 hover:text-red-400 hover:bg-red-950 !px-2 !py-1"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-1">Upload File</h2>
            <p className="text-sm text-gray-500 mb-6">Select a folder and a file to upload to S3.</p>
            <form onSubmit={uploadFile} className="space-y-4">
              <div>
                <label className={labelClass}>Folder</label>
                <select
                  title="Select folder"
                  value={uploadFolderId}
                  onChange={e => setUploadFolderId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Choose folder...</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>File</label>
                <input
                  type="file"
                  title="Choose file to upload"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none file:mr-3 file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:cursor-pointer file:text-xs"
                />
              </div>
              <Button
                type="submit"
                variant="success"
                loading={loading}
                disabled={!selectedFile || !uploadFolderId}
                className="w-full"
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </Button>
            </form>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-1">Grant File Access</h2>
            <p className="text-sm text-gray-500 mb-6">Give a specific user access to view and download a file.</p>
            <form onSubmit={grantPermission} className="space-y-4">
              <div>
                <label className={labelClass}>File</label>
                <select
                  title="Select file"
                  value={permFileId}
                  onChange={e => setPermFileId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select file...</option>
                  {files.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.folders?.name ? `${f.folders.name} / ${f.original_name}` : f.original_name}
                    </option>
                  ))}
                </select>
                {files.length === 0 && !dataLoading && (
                  <p className="text-xs text-gray-600 mt-1">No files uploaded yet.</p>
                )}
              </div>
              <div>
                <label className={labelClass}>User</label>
                <select
                  title="Select user"
                  value={permUserId}
                  onChange={e => setPermUserId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select user...</option>
                  {users.filter(u => u.role === 'user').map(u => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                loading={loading}
                disabled={!permFileId || !permUserId}
                className="w-full"
              >
                {loading ? 'Granting...' : 'Grant Access'}
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
