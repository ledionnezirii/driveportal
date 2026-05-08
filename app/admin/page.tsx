'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { Folder, FolderOpen, FileText, Users, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface FolderItem { id: string; name: string }
interface UserItem { id: string; email: string; role: string }
interface FileItem { id: string; original_name: string; folder_id: string; folders?: { name: string } }
interface GroupItem { id: string; name: string }

export default function AdminPage() {
  const router = useRouter()
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [folderName, setFolderName] = useState('')
  const [uploadFolderId, setUploadFolderId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [permFileId, setPermFileId] = useState('')
  const [permUserId, setPermUserId] = useState('')
  const [permFolderId, setPermFolderId] = useState('')
  const [permFolderUserId, setPermFolderUserId] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupUserId, setGroupUserId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [groupPermFileId, setGroupPermFileId] = useState('')
  const [groupPermFolderId, setGroupPermFolderId] = useState('')
  const [groupPermGroupId, setGroupPermGroupId] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)
  const [activeTab, setActiveTab] = useState<'folders' | 'upload' | 'permissions' | 'groups'>('folders')
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null)

  const showToast = useCallback((text: string, ok: boolean) => {
    setToast({ text, ok })
  }, [])

  const fetchAll = useCallback(async () => {
    setDataLoading(true)
    try {
      const [fData, uData, filesData, gData] = await Promise.all([
        api.folders.list(),
        api.users.list(),
        api.files.list(),
        api.groups.list(),
      ])
      setFolders(fData)
      setUsers(uData)
      setFiles(filesData)
      setGroups(gData)
    } catch {
      showToast('Failed to load data', false)
    } finally {
      setDataLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    if (localStorage.getItem('role') !== 'admin') { router.push('/dashboard'); return }
    fetchAll()
  }, [fetchAll, router])

  async function createFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!folderName.trim()) return
    setLoading(true)
    try {
      await api.folders.create(folderName)
      setFolderName('')
      showToast('Folder created!', true)
      fetchAll()
    } catch { showToast('Failed to create folder', false) }
    finally { setLoading(false) }
  }

  async function deleteFolder(id: string) {
    if (!confirm('Delete this folder and all its files?')) return
    await api.folders.delete(id)
    fetchAll()
  }

  async function deleteFile(id: string) {
    if (!confirm('Delete this file?')) return
    try {
      await api.files.delete(id)
      showToast('File deleted', true)
      fetchAll()
    } catch { showToast('Failed to delete file', false) }
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
      showToast('File uploaded!', true)
      fetchAll()
    } catch { showToast('Upload failed', false) }
    finally { setLoading(false) }
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
    } catch (err) { showToast(err instanceof Error ? err.message : 'Failed to grant access', false) }
    finally { setLoading(false) }
  }

  async function grantGroupPermission(e: React.FormEvent) {
    e.preventDefault()
    if (!groupPermFileId || !groupId) return
    setLoading(true)
    try {
      await api.permissions.grant({ file_id: groupPermFileId, group_id: groupId })
      showToast('Group access granted!', true)
      setGroupPermFileId('')
      setGroupId('')
    } catch (err) { showToast(err instanceof Error ? err.message : 'Failed to grant group access', false) }
    finally { setLoading(false) }
  }

  async function grantFolderPermission(e: React.FormEvent) {
    e.preventDefault()
    if (!permFolderId || !permFolderUserId) return
    setLoading(true)
    try {
      await api.permissions.grant({ folder_id: permFolderId, user_id: permFolderUserId })
      showToast('Folder access granted!', true)
      setPermFolderId('')
      setPermFolderUserId('')
    } catch { showToast('Failed to grant folder access', false) }
    finally { setLoading(false) }
  }

  async function grantGroupFolderPermission(e: React.FormEvent) {
    e.preventDefault()
    if (!groupPermFolderId || !groupPermGroupId) return
    setLoading(true)
    try {
      await api.permissions.grant({ folder_id: groupPermFolderId, group_id: groupPermGroupId })
      showToast('Group folder access granted!', true)
      setGroupPermFolderId('')
      setGroupPermGroupId('')
    } catch { showToast('Failed to grant group folder access', false) }
    finally { setLoading(false) }
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!groupName.trim()) return
    setLoading(true)
    try {
      await api.groups.create(groupName)
      setGroupName('')
      showToast('Group created!', true)
      fetchAll()
    } catch { showToast('Failed to create group', false) }
    finally { setLoading(false) }
  }

  async function addUserToGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!groupId || !groupUserId) return
    setLoading(true)
    try {
      await api.groups.addUser(groupId, groupUserId)
      showToast('User added to group!', true)
      setGroupUserId('')
    } catch (err) { showToast(err instanceof Error ? err.message : 'Failed to add user', false) }
    finally { setLoading(false) }
  }

  function handleLogout() {
    localStorage.clear()
    router.push('/login')
  }

  const inputClass = 'w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600'
  const labelClass = 'block text-xs text-gray-400 uppercase tracking-wider mb-1.5'

  const tabs = [
    { key: 'folders', label: 'Folders' },
    { key: 'upload', label: 'Upload' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'groups', label: 'Groups' },
  ] as const

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
        {toast && <Toast message={toast.text} ok={toast.ok} onDone={() => setToast(null)} />}

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

        {/* FOLDERS TAB */}
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
                <Button type="submit" loading={loading} disabled={!folderName.trim()}>Create</Button>
              </form>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-4">
                All Folders
                <span className="ml-2 text-xs text-gray-500 font-normal">{folders.length} total</span>
              </h2>
              {dataLoading ? (
                <div className="space-y-2"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
              ) : folders.length === 0 ? (
                <div className="text-center py-10 text-gray-600">
                  <Folder size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No folders yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {folders.map(folder => {
                    const folderFiles = files.filter(f => f.folder_id === folder.id)
                    const isExpanded = expandedFolder === folder.id
                    return (
                      <div key={folder.id} className="bg-gray-800 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedFolder(isExpanded ? null : folder.id)}
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                            {isExpanded ? <FolderOpen size={18} className="text-blue-400 shrink-0" /> : <Folder size={18} className="text-gray-400 shrink-0" />}
                            <div>
                              <p className="text-sm font-medium">{folder.name}</p>
                              <p className="text-xs text-gray-500">{folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''}</p>
                            </div>
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => deleteFolder(folder.id)}
                            className="!px-2 !py-1 text-red-500 hover:text-red-400 hover:bg-red-950"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-700 divide-y divide-gray-700">
                            {folderFiles.length === 0 ? (
                              <p className="text-xs text-gray-600 px-5 py-3">No files in this folder.</p>
                            ) : (
                              folderFiles.map(file => (
                                <div key={file.id} className="flex items-center justify-between px-5 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <FileText size={15} className="text-gray-500 shrink-0" />
                                    <span className="text-sm text-gray-300">{file.original_name}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => deleteFile(file.id)}
                                    className="!px-2 !py-1 text-red-500 hover:text-red-400 hover:bg-red-950"
                                  >
                                    <Trash2 size={14} />
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
              )}
            </div>
          </div>
        )}

        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-1">Upload File</h2>
            <p className="text-sm text-gray-500 mb-6">Select a folder and upload a file to S3.</p>
            <form onSubmit={uploadFile} className="space-y-4">
              <div>
                <label className={labelClass}>Folder</label>
                <select title="Select folder" value={uploadFolderId} onChange={e => setUploadFolderId(e.target.value)} className={inputClass}>
                  <option value="">Choose folder...</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>File</label>
                <input
                  type="file"
                  title="Choose file"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none file:mr-3 file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:cursor-pointer file:text-xs"
                />
              </div>
              <Button type="submit" variant="success" loading={loading} disabled={!selectedFile || !uploadFolderId} className="w-full">
                {loading ? 'Uploading...' : 'Upload File'}
              </Button>
            </form>
          </div>
        )}

        {/* PERMISSIONS TAB */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            {/* Grant file access to user */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-1">Grant File Access</h2>
              <p className="text-sm text-gray-500 mb-5">Give a user access to a specific file.</p>
              <form onSubmit={grantPermission} className="space-y-4">
                <div>
                  <label className={labelClass}>File</label>
                  <select title="Select file" value={permFileId} onChange={e => setPermFileId(e.target.value)} className={inputClass}>
                    <option value="">Select file...</option>
                    {files.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.folders?.name ? `${f.folders.name} / ${f.original_name}` : f.original_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>User</label>
                  <select title="Select user" value={permUserId} onChange={e => setPermUserId(e.target.value)} className={inputClass}>
                    <option value="">Select user...</option>
                    {users.filter(u => u.role === 'user').map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                  </select>
                </div>
                <Button type="submit" loading={loading} disabled={!permFileId || !permUserId} className="w-full">
                  {loading ? 'Granting...' : 'Grant File Access'}
                </Button>
              </form>
            </div>

            {/* Grant folder access to user */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-1">Grant Folder Access</h2>
              <p className="text-sm text-gray-500 mb-5">Give a user access to all files inside a folder.</p>
              <form onSubmit={grantFolderPermission} className="space-y-4">
                <div>
                  <label className={labelClass}>Folder</label>
                  <select title="Select folder" value={permFolderId} onChange={e => setPermFolderId(e.target.value)} className={inputClass}>
                    <option value="">Select folder...</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>User</label>
                  <select title="Select user" value={permFolderUserId} onChange={e => setPermFolderUserId(e.target.value)} className={inputClass}>
                    <option value="">Select user...</option>
                    {users.filter(u => u.role === 'user').map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                  </select>
                </div>
                <Button type="submit" loading={loading} disabled={!permFolderId || !permFolderUserId} className="w-full">
                  {loading ? 'Granting...' : 'Grant Folder Access'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Create group */}
              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="text-base font-semibold mb-4">Create Group</h2>
                <form onSubmit={createGroup} className="flex gap-3">
                  <input
                    type="text"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="e.g. Marketing"
                    className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                  />
                  <Button type="submit" loading={loading} disabled={!groupName.trim()}>Create</Button>
                </form>

                <div className="mt-4 space-y-2">
                  {dataLoading ? (
                    <SkeletonRow />
                  ) : groups.length === 0 ? (
                    <p className="text-sm text-gray-600">No groups yet.</p>
                  ) : (
                    groups.map(g => (
                      <div key={g.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                        <Users size={14} className="text-gray-400 shrink-0" />
                        <span className="text-sm font-medium">{g.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add user to group */}
              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="text-base font-semibold mb-4">Add User to Group</h2>
                <form onSubmit={addUserToGroup} className="space-y-3">
                  <div>
                    <label className={labelClass}>Group</label>
                    <select title="Select group" value={groupId} onChange={e => setGroupId(e.target.value)} className={inputClass}>
                      <option value="">Select group...</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>User</label>
                    <select title="Select user" value={groupUserId} onChange={e => setGroupUserId(e.target.value)} className={inputClass}>
                      <option value="">Select user...</option>
                      {users.filter(u => u.role === 'user').map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                    </select>
                  </div>
                  <Button type="submit" loading={loading} disabled={!groupId || !groupUserId} className="w-full">
                    Add to Group
                  </Button>
                </form>
              </div>
            </div>

            {/* Grant group file access */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-1">Grant Group Access to File</h2>
              <p className="text-sm text-gray-500 mb-4">All members of the group will get access to this file.</p>
              <form onSubmit={grantGroupPermission} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>File</label>
                  <select title="Select file" value={groupPermFileId} onChange={e => setGroupPermFileId(e.target.value)} className={inputClass}>
                    <option value="">Select file...</option>
                    {files.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.folders?.name ? `${f.folders.name} / ${f.original_name}` : f.original_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Group</label>
                  <select title="Select group" value={groupId} onChange={e => setGroupId(e.target.value)} className={inputClass}>
                    <option value="">Select group...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" loading={loading} disabled={!groupPermFileId || !groupId} className="w-full">
                    {loading ? 'Granting...' : 'Grant Group File Access'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Grant group folder access */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-1">Grant Group Access to Folder</h2>
              <p className="text-sm text-gray-500 mb-4">All members of the group will see all files inside this folder.</p>
              <form onSubmit={grantGroupFolderPermission} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Folder</label>
                  <select title="Select folder" value={groupPermFolderId} onChange={e => setGroupPermFolderId(e.target.value)} className={inputClass}>
                    <option value="">Select folder...</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Group</label>
                  <select title="Select group" value={groupPermGroupId} onChange={e => setGroupPermGroupId(e.target.value)} className={inputClass}>
                    <option value="">Select group...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" loading={loading} disabled={!groupPermFolderId || !groupPermGroupId} className="w-full">
                    {loading ? 'Granting...' : 'Grant Group Folder Access'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
