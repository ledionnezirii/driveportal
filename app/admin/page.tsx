'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { Folder, FileText, Users, Trash2, LogOut, Upload, Shield, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

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
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null)
  const [folderGroupPerms, setFolderGroupPerms] = useState<{ group_id: string; groups: { name: string } }[]>([])
  const [folderDetailLoading, setFolderDetailLoading] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string } | null>(null)
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<{ users: { id: string; email: string } }[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)

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

  function deleteFolder(id: string) {
    setConfirm({
      message: 'This will permanently delete the folder and all its files.',
      onConfirm: async () => { await api.folders.delete(id); fetchAll() }
    })
  }

  function deleteFile(id: string) {
    setConfirm({
      message: 'This will permanently delete the file.',
      onConfirm: async () => {
        try {
          await api.files.delete(id)
          showToast('File deleted', true)
          fetchAll()
        } catch { showToast('Failed to delete file', false) }
      }
    })
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
    if (!groupPermFileId || !groupPermGroupId) return
    setLoading(true)
    try {
      await api.permissions.grant({ file_id: groupPermFileId, group_id: groupPermGroupId })
      showToast('Group access granted!', true)
      setGroupPermFileId('')
      setGroupPermGroupId('')
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

  async function openFolder(folder: { id: string; name: string }) {
    setSelectedFolder(folder)
    setFolderDetailLoading(true)
    try {
      const data = await api.folders.groups(folder.id)
      setFolderGroupPerms(data)
    } finally {
      setFolderDetailLoading(false)
    }
  }

  async function openGroup(group: { id: string; name: string }) {
    setSelectedGroup(group)
    setMembersLoading(true)
    try {
      const data = await api.groups.members(group.id)
      setSelectedGroupMembers(data as { users: { id: string; email: string } }[])
    } finally {
      setMembersLoading(false)
    }
  }

  const inputClass = 'w-full bg-white/6 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 placeholder:text-gray-600 transition-colors'
  const labelClass = 'block text-xs text-gray-500 uppercase tracking-wider mb-1.5'

  const tabs = [
    { key: 'folders', label: 'Folders', icon: Folder },
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'permissions', label: 'Permissions', icon: Shield },
    { key: 'groups', label: 'Groups', icon: Users },
  ] as const

  return (
    <div className="min-h-screen text-white flex flex-col">
      <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" title={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(!mobileOpen)} className="sm:hidden text-gray-400 hover:text-white transition-colors mr-1">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Logo size={30} />
          <h1 className="text-xl font-bold tracking-tight">DrivePortal</h1>
          <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <button type="button" title="Sign out" onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <div className="flex flex-1">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 sm:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed sm:sticky top-[65px] left-0 z-40 sm:z-auto
          h-[calc(100vh-65px)] sm:self-start
          bg-[#02040f] sm:bg-black/20 border-r border-white/8
          p-3 flex flex-col gap-1 shrink-0
          transition-all duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
          ${sidebarOpen ? 'w-52' : 'w-52 sm:w-14'}
        `}>
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key); setMobileOpen(false) }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                  activeTab === tab.key
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Icon size={16} className={`shrink-0 ${activeTab === tab.key ? 'text-blue-400' : ''}`} />
                <span className={`transition-all duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 sm:hidden'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}

          {/* Desktop collapse toggle — edge button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden sm:flex absolute -right-3 top-5 w-6 h-6 rounded-full bg-[#0d1b2e] border border-white/15 items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all shadow-md z-10"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-8 py-7 pb-12 min-w-0 overflow-y-auto overflow-x-hidden">
        {toast && <Toast message={toast.text} ok={toast.ok} onDone={() => setToast(null)} />}
        {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

        {/* FOLDERS TAB — list view */}
        {activeTab === 'folders' && !selectedFolder && (
          <div className="space-y-6">
            <div className="bg-white/4 border border-white/8 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-semibold">Folders</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{folders.length} folder{folders.length !== 1 ? 's' : ''} total</p>
                </div>
                <form onSubmit={createFolder} className="flex gap-2 sm:w-72">
                  <input
                    type="text"
                    value={folderName}
                    onChange={e => setFolderName(e.target.value)}
                    placeholder="e.g. Q4 Reports"
                    className={inputClass}
                  />
                  <Button type="submit" loading={loading} disabled={!folderName.trim()}>Create</Button>
                </form>
              </div>
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
                    return (
                      <div key={folder.id} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3 hover:bg-white/8 hover:border-white/15 transition-all group/row">
                        <button
                          type="button"
                          onClick={() => openFolder(folder)}
                          className="flex items-center gap-3 flex-1 text-left min-w-0"
                        >
                          <Folder size={18} className="text-blue-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{folder.name}</p>
                            <p className="text-xs text-gray-500">{folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''}</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-600 group-hover/row:text-gray-400 transition-colors shrink-0" />
                        </button>
                        <button
                          type="button"
                          title="Delete folder"
                          onClick={() => deleteFolder(folder.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors opacity-0 group-hover/row:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOLDERS TAB — folder detail view */}
        {activeTab === 'folders' && selectedFolder && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedFolder(null)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <span className="text-gray-600">/</span>
              <div className="flex items-center gap-2">
                <Folder size={15} className="text-blue-400" />
                <span className="text-sm font-semibold">{selectedFolder.name}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Files */}
              <div className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8">
                  <h2 className="text-sm font-semibold">Files</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{files.filter(f => f.folder_id === selectedFolder.id).length} file{files.filter(f => f.folder_id === selectedFolder.id).length !== 1 ? 's' : ''}</p>
                </div>
                {files.filter(f => f.folder_id === selectedFolder.id).length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <FileText size={32} className="mx-auto mb-2 text-gray-700" />
                    <p className="text-sm text-gray-500">No files in this folder.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/6">
                    {files.filter(f => f.folder_id === selectedFolder.id).map(file => (
                      <div key={file.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/4 transition-colors group/file">
                        <FileText size={15} className="text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-300 truncate flex-1">{file.original_name}</span>
                        <button
                          type="button"
                          title="Delete file"
                          onClick={() => {
                            deleteFile(file.id)
                            setSelectedFolder(prev => prev)
                          }}
                          className="opacity-0 group-hover/file:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Groups with access */}
              <div className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8">
                  <h2 className="text-sm font-semibold">Groups with Access</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Groups that can see all files in this folder</p>
                </div>
                {folderDetailLoading ? (
                  <div className="p-4 space-y-3"><SkeletonRow /><SkeletonRow /></div>
                ) : folderGroupPerms.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Users size={32} className="mx-auto mb-2 text-gray-700" />
                    <p className="text-sm text-gray-500">No groups have access yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/6">
                    {folderGroupPerms.map((perm, i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                          <Users size={13} className="text-blue-400" />
                        </div>
                        <span className="text-sm text-gray-300">{perm.groups?.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="bg-white/4 border border-white/8 rounded-xl p-4">
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
                  className="w-full bg-white/6 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm outline-none file:mr-3 file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:cursor-pointer file:text-xs"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white/4 border border-white/8 rounded-xl p-4">
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

            <div className="bg-white/4 border border-white/8 rounded-xl p-4">
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

        {/* GROUPS TAB — list view */}
        {activeTab === 'groups' && !selectedGroup && (
          <div className="space-y-6">
            <div className="bg-white/4 border border-white/8 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-semibold">Groups</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{groups.length} group{groups.length !== 1 ? 's' : ''} total</p>
                </div>
                <form onSubmit={createGroup} className="flex gap-2 sm:w-72">
                  <input
                    type="text"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="New group name..."
                    className={inputClass}
                  />
                  <Button type="submit" loading={loading} disabled={!groupName.trim()}>Create</Button>
                </form>
              </div>
              {dataLoading ? (
                <div className="space-y-2"><SkeletonRow /><SkeletonRow /></div>
              ) : groups.length === 0 ? (
                <p className="text-sm text-gray-600">No groups yet. Create one above.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {groups.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => openGroup(g)}
                      className="flex items-center gap-3 bg-white/6 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 hover:border-white/20 transition-all text-left group/card"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Users size={15} className="text-blue-400" />
                      </div>
                      <span className="text-sm font-medium flex-1">{g.name}</span>
                      <ChevronRight size={14} className="text-gray-600 group-hover/card:text-gray-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/4 border border-white/8 rounded-xl p-4 flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Add User to Group</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Assign a user to an existing group.</p>
                </div>
                <form onSubmit={addUserToGroup} className="flex flex-col gap-3 flex-1">
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
                  <Button type="submit" loading={loading} disabled={!groupId || !groupUserId} className="w-full mt-auto">Add to Group</Button>
                </form>
              </div>

              <div className="bg-white/4 border border-white/8 rounded-xl p-4 flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Grant File Access</h2>
                  <p className="text-xs text-gray-500 mt-0.5">All group members get access to this file.</p>
                </div>
                <form onSubmit={grantGroupPermission} className="flex flex-col gap-3 flex-1">
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
                    <select title="Select group" value={groupPermGroupId} onChange={e => setGroupPermGroupId(e.target.value)} className={inputClass}>
                      <option value="">Select group...</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <Button type="submit" loading={loading} disabled={!groupPermFileId || !groupPermGroupId} className="w-full mt-auto">
                    {loading ? 'Granting...' : 'Grant File Access'}
                  </Button>
                </form>
              </div>

              <div className="bg-white/4 border border-white/8 rounded-xl p-4 flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Grant Folder Access</h2>
                  <p className="text-xs text-gray-500 mt-0.5">All group members see all files in this folder.</p>
                </div>
                <form onSubmit={grantGroupFolderPermission} className="flex flex-col gap-3 flex-1">
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
                  <Button type="submit" loading={loading} disabled={!groupPermFolderId || !groupPermGroupId} className="w-full mt-auto">
                    {loading ? 'Granting...' : 'Grant Folder Access'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* GROUPS TAB — group detail view */}
        {activeTab === 'groups' && selectedGroup && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <span className="text-gray-600">/</span>
              <div className="flex items-center gap-2">
                <Users size={15} className="text-blue-400" />
                <span className="text-sm font-semibold">{selectedGroup.name}</span>
              </div>
            </div>

            <div className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8">
                <h2 className="text-sm font-semibold">Members</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedGroupMembers.length} user{selectedGroupMembers.length !== 1 ? 's' : ''}</p>
              </div>
              {membersLoading ? (
                <div className="p-4 space-y-3"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
              ) : selectedGroupMembers.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Users size={32} className="mx-auto mb-2 text-gray-700" />
                  <p className="text-sm text-gray-500">No members in this group yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/6">
                  {selectedGroupMembers.map((m, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-white/4 transition-colors group/member">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 text-sm font-semibold shrink-0">
                        {m.users?.email?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-200 flex-1">{m.users?.email}</span>
                      <button
                        type="button"
                        title="Remove from group"
                        onClick={async () => {
                          await api.groups.removeUser(selectedGroup.id, m.users.id)
                          setSelectedGroupMembers(prev => prev.filter((_, idx) => idx !== i))
                          showToast('User removed from group', true)
                        }}
                        className="opacity-0 group-hover/member:opacity-100 transition-opacity flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg px-2.5 py-1"
                      >
                        <Trash2 size={11} />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  )
}
