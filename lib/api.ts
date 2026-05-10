function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}

async function json<T>(res: Promise<Response> | Response): Promise<T> {
  const r = await res
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.error || 'Request failed')
  }
  return r.json()
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      json<{ token: string; user: { id: string; email: string; role: string } }>(
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
      ),
    register: (email: string, password: string) =>
      json<{ token: string; user: { id: string; email: string; role: string } }>(
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'user' }),
        })
      ),
  },

  folders: {
    list: () => json<{ id: string; name: string; created_at: string }[]>(authFetch('/api/folders')),
    create: (name: string) =>
      json(authFetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })),
    delete: (id: string) => authFetch(`/api/folders/${id}`, { method: 'DELETE' }),
    groups: (id: string) => json<{ group_id: string; groups: { name: string } }[]>(authFetch(`/api/folders/${id}`)),
  },

  files: {
    list: () =>
      json<{ id: string; original_name: string; folder_id: string; folders?: { name: string } }[]>(
        authFetch('/api/files')
      ),
    upload: (folderId: string, file: File) => {
      const form = new FormData()
      form.append('file', file)
      form.append('folder_id', folderId)
      return json(authFetch('/api/files/upload', { method: 'POST', body: form }))
    },
    delete: (id: string) => authFetch(`/api/files/${id}`, { method: 'DELETE' }),
    download: (id: string) => authFetch(`/api/files/${id}/download`),
  },

  groups: {
    list: () => json<{ id: string; name: string }[]>(authFetch('/api/groups')),
    create: (name: string) =>
      json(authFetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })),
    members: (groupId: string) => json(authFetch(`/api/groups/${groupId}/users`)),
    addUser: (groupId: string, userId: string) =>
      json(authFetch(`/api/groups/${groupId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })),
    removeUser: (groupId: string, userId: string) =>
      json(authFetch(`/api/groups/${groupId}/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })),
  },

  permissions: {
    grant: (payload: { file_id?: string; folder_id?: string; user_id?: string; group_id?: string }) =>
      json(authFetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })),
  },

  users: {
    list: () => json<{ id: string; email: string; role: string }[]>(authFetch('/api/users')),
  },

  dashboard: {
    get: () =>
      json<{
        files: { id: string; original_name: string; folder_id: string; created_at: string }[]
        folders: { id: string; name: string; created_at: string }[]
      }>(authFetch('/api/dashboard')),
  },
}
