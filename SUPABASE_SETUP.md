# Supabase Setup Guide 🗄️

This guide will walk you through setting up Supabase for the WhatsApp Web Integration project.

## 📋 Table of Contents

1. [Create Supabase Project](#1-create-supabase-project)
2. [Get API Credentials](#2-get-api-credentials)
3. [Run Database Migrations](#3-run-database-migrations)
4. [Configure Row Level Security](#4-configure-row-level-security)
5. [Set Up Storage Bucket](#5-set-up-storage-bucket)
6. [Enable Realtime](#6-enable-realtime)
7. [Test Connection](#7-test-connection)

---

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Sign in with GitHub (recommended) or create an account
4. Create a new organization (if you don't have one)
5. Click **"New Project"**
6. Fill in project details:
   - **Name**: `whatsapp-web-integration` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier works fine for MVP
7. Click **"Create new project"**
8. Wait 2-3 minutes for project initialization

---

## 2. Get API Credentials

### 2.1 Get Project URL and API Keys

1. In your Supabase project dashboard, click **Settings** (gear icon) in the left sidebar
2. Click **API** under Project Settings
3. You'll see:

   **Project URL**
   ```
   https://your-project-id.supabase.co
   ```

   **API Keys**
   - `anon` `public` - For client-side code
   - `service_role` `secret` - For server-side code (keep secret!)

### 2.2 Add to .env File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# From Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Generate a random 32-character string for encryption
ENCRYPTION_KEY=your-32-character-random-string-here
```

### 2.3 Generate Encryption Key

Generate a secure encryption key:

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Manual**
Visit [random.org/strings](https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new) and generate a 32-character string.

Add the generated key to `.env`:
```env
ENCRYPTION_KEY=your-generated-key-here
```

---

## 3. Run Database Migrations

### 3.1 Open SQL Editor

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**

### 3.2 Copy and Run Migration SQL

1. Open the file `supabase/migrations.sql` in this project
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **"Run"** (or press `Ctrl/Cmd + Enter`)
5. You should see: ✅ **Success. No rows returned**

### 3.3 Verify Tables Created

1. Click **Database** in the left sidebar
2. Click **Tables**
3. You should see:
   - ✅ `sessions`
   - ✅ `messages`

4. Click on each table to verify the schema matches the migration file

---

## 4. Configure Row Level Security

RLS (Row Level Security) is automatically configured by the migration script, but let's verify:

### 4.1 Verify RLS is Enabled

1. Go to **Database** > **Tables**
2. Click on `sessions` table
3. You should see **RLS enabled** badge
4. Repeat for `messages` table

### 4.2 View RLS Policies

1. Click **Authentication** > **Policies** in the left sidebar
2. You should see policies for:
   - `sessions` (4 policies: SELECT, INSERT, UPDATE, DELETE)
   - `messages` (4 policies: SELECT, INSERT, UPDATE, DELETE)

### 4.3 Test RLS (Optional)

You can test RLS policies in the SQL Editor:

```sql
-- This should return nothing (not authenticated)
SELECT * FROM sessions;

-- This should work (as service role)
SELECT * FROM sessions WHERE user_id = 'some-user-id';
```

---

## 5. Set Up Storage Bucket

### 5.1 Create Storage Bucket

1. Click **Storage** in the left sidebar
2. Click **"New bucket"**
3. Fill in:
   - **Name**: `whatsapp-media`
   - **Public bucket**: ❌ **OFF** (keep private)
   - **File size limit**: `50 MB` (52428800 bytes)
   - **Allowed MIME types**: Leave empty or add:
     ```
     image/*
     video/*
     audio/*
     application/pdf
     ```
4. Click **"Create bucket"**

### 5.2 Set Bucket Policies

1. Click on the `whatsapp-media` bucket
2. Click **Policies** tab
3. Click **"New policy"**

**Policy 1: Authenticated users can upload**

```sql
-- Allow authenticated users to upload files to their session folder
CREATE POLICY "Users can upload to their session folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'whatsapp-media' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM sessions WHERE user_id = auth.uid()
  )
);
```

**Policy 2: Authenticated users can read their files**

```sql
-- Allow authenticated users to read files from their sessions
CREATE POLICY "Users can read their session files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'whatsapp-media' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM sessions WHERE user_id = auth.uid()
  )
);
```

**Policy 3: Authenticated users can delete their files**

```sql
-- Allow authenticated users to delete files from their sessions
CREATE POLICY "Users can delete their session files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'whatsapp-media' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM sessions WHERE user_id = auth.uid()
  )
);
```

---

## 6. Enable Realtime

### 6.1 Enable Realtime for Tables

1. Go to **Database** > **Replication**
2. Find `messages` table in the list
3. Toggle **ON** the following columns:
   - ✅ `id`
   - ✅ `session_id`
   - ✅ `from_number`
   - ✅ `to_number`
   - ✅ `content`
   - ✅ `timestamp`
   - ✅ `is_from_me`
   - ✅ All other columns you want to receive in real-time

4. Repeat for `sessions` table:
   - ✅ `id`
   - ✅ `status`
   - ✅ `qr_code`
   - ✅ `phone_number`
   - ✅ All other relevant columns

### 6.2 Configure Realtime Settings (Optional)

1. Go to **Settings** > **API**
2. Scroll to **Realtime** section
3. Ensure:
   - ✅ **Realtime enabled**: ON
   - **Max connections**: 200 (default)
   - **Max events per second**: 10 (default)

---

## 7. Test Connection

### 7.1 Run Test Script

From your project directory:

```bash
npm run test:supabase
```

You should see:

```
🔍 Testing Supabase connection...

Test 1: Basic Connection
✅ Connection successful

Test 2: Verify Tables
✅ Table 'sessions' exists
✅ Table 'messages' exists

Test 3: Row Level Security
✅ RLS policies are configured

Test 4: Storage Bucket
✅ Storage bucket "whatsapp-media" exists

Test 5: Authentication
✅ Auth client initialized successfully

========================================
✅ All tests passed!
========================================
```

### 7.2 Troubleshooting

If tests fail, check:

1. **Connection Error**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env`
   - Check internet connection
   - Ensure Supabase project is active

2. **Table Not Found**
   - Re-run migrations in SQL Editor
   - Check for SQL errors in migration

3. **RLS Error**
   - Verify policies are created
   - Check policy syntax

4. **Storage Bucket Not Found**
   - Create bucket manually in Supabase Dashboard
   - Ensure bucket name matches `.env` (default: `whatsapp-media`)

5. **Auth Error**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env`
   - Check key is correct (should start with `eyJ...`)

---

## 🎉 Setup Complete!

Your Supabase configuration is now complete. You can proceed to run the application:

```bash
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000)

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🆘 Need Help?

- Check our [GitHub Issues](../../issues)
- Read the [main README](./README.md)
- Visit [Supabase Discord](https://discord.supabase.com)
