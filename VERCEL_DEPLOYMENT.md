# Deploying to Vercel 🚀

Complete guide for deploying WhatsApp Web Integration to Vercel.

## ⚠️ Important Notice

**WhatsApp Web Integration requires persistent storage and long-running processes for WhatsApp sessions.** Vercel's serverless functions have limitations:

- **10-second timeout** on Hobby plan (60 seconds on Pro)
- **No persistent file storage** between invocations
- **Ephemeral environment** - sessions reset on each deployment

### Recommended for Vercel:

✅ **Testing and demonstration** purposes
✅ **Frontend-only** deployment (if you run WhatsApp connector separately)
❌ **Production use** (use dedicated server, VPS, or Docker instead)

### Better Alternatives for Production:

- **Railway** - Persistent storage, long-running processes
- **DigitalOcean App Platform** - Better for stateful apps
- **AWS ECS/EC2** - Full control
- **Self-hosted VPS** with Docker - Best for WhatsApp sessions
- **Heroku** - Easy deployment (note: paid plans required)

---

## 🎯 Deployment Steps

### Step 1: Prepare Your Repository

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "feat: Add Vercel deployment support"
git push origin claude/whatsapp-mvp-supabase-init-011CV46vSdMbs482NCGPB5XK
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### Step 3: Import Project

1. Click **"Add New..."** > **"Project"**
2. Import your GitHub repository: `whatsapp-web-integration`
3. Select the branch: `claude/whatsapp-mvp-supabase-init-011CV46vSdMbs482NCGPB5XK`

### Step 4: Configure Environment Variables

⚠️ **This is the most important step!**

In the Vercel project settings, add these environment variables:

#### Required Variables:

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJh...` | Supabase Dashboard > Settings > API (anon public) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...` | Supabase Dashboard > Settings > API (service_role secret) |
| `ENCRYPTION_KEY` | `[32-char random string]` | Generate with command below |

#### Generate Encryption Key:

```bash
# Run this locally
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 32

# Copy the output and paste as ENCRYPTION_KEY in Vercel
```

#### Optional Variables:

| Variable | Default Value | Description |
|----------|--------------|-------------|
| `SESSION_DATA_PATH` | `/tmp/session-data` | Path for session storage (⚠️ ephemeral on Vercel) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `SUPABASE_MEDIA_BUCKET` | `whatsapp-media` | Storage bucket name |

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. ✅ Your app will be live at `https://your-project.vercel.app`

---

## 🔧 Vercel Dashboard Setup

### Adding Environment Variables:

1. Go to your project in Vercel Dashboard
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar
4. Add each variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://your-project.supabase.co`
   - **Environments**: Check all (Production, Preview, Development)
   - Click **"Add"**
5. Repeat for all required variables

### After Adding Variables:

You **must redeploy** for changes to take effect:

1. Go to **Deployments** tab
2. Click the three dots `...` on latest deployment
3. Click **"Redeploy"**
4. Select **"Use existing Build Cache"** ❌ OFF
5. Click **"Redeploy"**

---

## ⚠️ Known Limitations on Vercel

### 1. WhatsApp Sessions Will Not Persist

**Problem:**
- Vercel serverless functions are stateless
- File system is ephemeral (`/tmp`)
- Sessions reset on each cold start

**Impact:**
- You'll need to scan QR code frequently
- Sessions disconnect unexpectedly

**Solution:**
- Use external session storage (Redis, S3, Database)
- Or deploy to a persistent environment (VPS, Docker)

### 2. Long-Running Connections Timeout

**Problem:**
- Vercel functions timeout after 10-60 seconds
- WhatsApp Web requires persistent WebSocket connection

**Impact:**
- Real-time features may not work reliably
- Message polling instead of push

**Solution:**
- Deploy WhatsApp connector separately on always-on server
- Use Vercel only for frontend + API gateway

### 3. Cold Starts

**Problem:**
- First request after inactivity takes 5-10 seconds

**Impact:**
- Slow initial page load
- Poor user experience

**Solution:**
- Upgrade to Vercel Pro for faster cold starts
- Use Vercel Edge Functions (experimental)

---

## 🎯 Recommended Hybrid Architecture

For production, split the application:

### Frontend + Auth API (Vercel):
- Next.js pages
- Authentication routes
- API gateway

### WhatsApp Connector (VPS/Railway):
- WhatsApp session management
- Message handling
- Persistent storage

### Database + Storage (Supabase):
- User data
- Message history
- Media files

---

## 🐛 Troubleshooting

### Build Fails: "Missing Supabase environment variables"

**Solution:**
1. Go to Vercel Dashboard > Settings > Environment Variables
2. Add all required variables (see Step 4 above)
3. Redeploy (without build cache)

### Build Fails: Puppeteer/Chromium errors

**Problem:**
- `whatsapp-web.js` requires Chromium
- Vercel build environment may not have it

**Solution:**
Add to `next.config.js`:

```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
  }
  return config;
}
```

(Already included in your project)

### Runtime Error: Cannot connect to WhatsApp

**Expected Behavior:**
- First connection will work
- After ~10 minutes of inactivity, session lost
- Need to scan QR again

**Why:**
- Vercel serverless functions don't maintain persistent connections
- WhatsApp Web session requires always-on process

**Solution:**
- Use dedicated server for production
- Or accept frequent re-scanning for demo/testing

### Deployment succeeds but app doesn't work

**Check:**
1. Are all environment variables set correctly?
2. Did you redeploy after adding env vars?
3. Check Vercel logs: Dashboard > Deployments > [your deployment] > Functions

**Debug:**
```bash
# View logs in real-time
vercel logs --follow
```

---

## 📊 Monitoring

### View Logs:

1. Vercel Dashboard > Your Project > Deployments
2. Click on a deployment
3. Click **"Functions"** tab
4. Select a function to view logs

### Common Errors:

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing Supabase environment variables` | Env vars not set | Add in Vercel Settings |
| `ENOENT: no such file or directory` | Session data path issue | Normal on Vercel (ephemeral) |
| `TimeoutError: Navigation timeout` | Puppeteer can't launch | Known Vercel limitation |
| `Cannot connect to database` | Wrong Supabase credentials | Check env vars |

---

## 🚀 Alternative: Deploy to Railway

For better WhatsApp session support:

1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Add environment variables
4. Deploy (will have persistent storage)

See `RAILWAY_DEPLOYMENT.md` for detailed guide.

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Limits](https://vercel.com/docs/limits)

---

## 🆘 Still Having Issues?

1. Check [GitHub Issues](../../issues)
2. Review [Vercel Limits](https://vercel.com/docs/limits)
3. Consider [Railway](https://railway.app) or Docker deployment
4. For production: Use dedicated VPS

---

**Remember:** Vercel is great for Next.js apps, but WhatsApp Web integration requires persistent processes. For production, use a dedicated server or container platform.
