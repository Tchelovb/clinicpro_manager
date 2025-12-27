# Auth Sync - Deployment Instructions

## 📋 Overview

This guide explains how to deploy the Auth Sync infrastructure to Supabase.

## 🗄️ Step 1: Database Migration

### Option A: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20241227_auth_sync_trigger.sql`
5. Paste into the editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify success message: "✅ Auth Sync infrastructure created successfully!"

### Option B: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

## ⚡ Step 2: Deploy Edge Function

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Logged in: `supabase login`
- Linked to project: `supabase link --project-ref your-project-ref`

### Deploy Command
```bash
# Navigate to project root
cd c:/Users/marce/OneDrive/Documentos/ClinicPro

# Deploy the function
supabase functions deploy create-user --no-verify-jwt
```

### Alternative: Manual Deployment
If CLI is not available:
1. Go to Supabase Dashboard → **Edge Functions**
2. Click **Create a new function**
3. Name it: `create-user`
4. Copy contents from `supabase/functions/create-user/index.ts`
5. Paste and deploy

## 🔑 Step 3: Environment Variables

The Edge Function needs access to:
- `SUPABASE_URL` - Automatically available
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically available

No additional configuration needed!

## ✅ Verification

### Test the Trigger
```sql
-- Create a test user in SQL Editor
SELECT auth.uid(); -- Should return NULL (not logged in)

-- Insert test user (this will trigger the sync)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name": "Test User", "role": "secretary", "clinic_id": "your-clinic-uuid"}'::jsonb
);

-- Check if user was created in public.users
SELECT * FROM public.users WHERE email = 'test@example.com';
-- Should return the user record
```

### Test the Edge Function
```bash
# Using curl
curl -X POST 'https://your-project.supabase.co/functions/v1/create-user' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "newuser@test.com",
    "password": "SecurePass123",
    "full_name": "New User",
    "role": "dentist",
    "clinic_id": "your-clinic-uuid"
  }'
```

## 🎯 Frontend Integration

Use the helper function:
```typescript
import { createUser } from '../services/userService';

const { data, error } = await createUser({
  email: 'doctor@clinic.com',
  password: 'TempPassword123',
  fullName: 'Dr. Silva',
  role: 'dentist',
  clinicId: currentClinicId
});
```

## 🔒 Security Notes

- ✅ Trigger runs with `SECURITY DEFINER` (safe)
- ✅ Edge Function uses Service Role Key (admin privileges)
- ✅ Frontend calls are authenticated via user JWT
- ⚠️ Only admins should have access to create-user function
- ⚠️ Implement RLS policies to restrict who can call this

## 🐛 Troubleshooting

### Trigger not firing
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

### Edge Function errors
- Check logs in Supabase Dashboard → Edge Functions → Logs
- Verify CORS headers if calling from browser
- Ensure Service Role Key is set correctly

## 📚 Next Steps

1. Create admin UI for user management
2. Add user invitation flow (send email with temp password)
3. Implement password reset functionality
4. Add user deactivation/deletion
