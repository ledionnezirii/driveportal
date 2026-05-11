# DrivePortal

A secure, role-based file distribution platform. Administrators upload and distribute files to specific users or groups. Standard users get a clean dashboard to browse and download only what has been shared with them.

---

## Features

**Admin**
- Create and delete folders
- Upload files of any format to AWS S3
- Grant file or folder access to individual users or groups
- Revoke access at any time
- Create and delete user groups, manage group membership

**Standard User**
- Dashboard with Folders and Groups sections
- Browse folders and download accessible files
- View assigned group memberships

**Security**
- JWT stored in `httpOnly` cookies — not accessible via JavaScript
- Role-Based Access Control enforced on every API route
- Non-admin requests to write/delete endpoints receive `403 Forbidden`
- File downloads served with `Content-Disposition: attachment` to prevent browser auto-execution
- Passwords hashed with bcrypt (10 rounds)
- Minimum password length enforced at registration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| File Storage | AWS S3 |
| Auth | Custom JWT (`jose` + `jsonwebtoken`) |
| Styling | Tailwind CSS |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An AWS S3 bucket

### Installation

```bash
git clone https://github.com/ledionnezirii/driveportal.git
cd driveportal
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS S3
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_BUCKET_NAME=your-bucket-name

# Auth
JWT_SECRET=your-long-random-secret
```

> **Never commit `.env.local` to version control.**

### Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamptz default now()
);

create table folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table files (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id) on delete cascade,
  original_name text not null,
  storage_path text not null,
  uploaded_by uuid references users(id),
  created_at timestamptz default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table user_groups (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  primary key (group_id, user_id)
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references files(id) on delete cascade,
  folder_id uuid references folders(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  created_at timestamptz default now()
);
```

### AWS S3 Setup

1. Create an S3 bucket
2. Set the bucket region to match `AWS_REGION` in your env
3. Create an IAM user with `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` permissions on your bucket
4. Use that IAM user's credentials in your env file

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Creating an Admin

Register a new account, then update the user's role directly in Supabase:

```sql
update users set role = 'admin' where email = 'admin@example.com';
```

### Admin Workflow

1. Go to `/admin`
2. **Folders** — create folders and upload files into them
3. **Permissions** — grant folder or file access to a user or group; revoke at any time
4. **Groups** — create groups, add users, grant group-level access

### User Workflow

1. Register or log in at `/login`
2. The dashboard shows **Folders** and **Groups**
3. Click a folder to browse its files and download them

---

## Deployment

The project is ready to deploy on [Vercel](https://vercel.com). Add all environment variables from `.env.local` in the Vercel project settings before deploying.

---

## License

MIT
