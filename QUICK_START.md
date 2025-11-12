# Quick Start Guide 🚀

Get WhatsApp Web Integration up and running in **under 15 minutes**.

## 📋 Prerequisites Checklist

Before you begin, make sure you have:

- [ ] **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- [ ] **npm** (v9 or higher) - Comes with Node.js
- [ ] **Git** - [Download](https://git-scm.com/)
- [ ] **Supabase Account** - [Sign up free](https://supabase.com)
- [ ] **Code Editor** (VS Code recommended)
- [ ] **WhatsApp** on your phone (for QR scanning)

Check your versions:
```bash
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher
git --version   # Any recent version
```

---

## 🎯 Step-by-Step Setup

### Step 1: Clone the Repository (2 minutes)

```bash
# Clone the repository
git clone https://github.com/your-username/whatsapp-web-integration.git

# Navigate to project directory
cd whatsapp-web-integration

# Install dependencies (this may take 2-3 minutes)
npm install
```

**Expected output:**
```
added 347 packages in 2m
```

---

### Step 2: Set Up Supabase (5 minutes)

#### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - Name: `whatsapp-integration`
   - Database password: `[generate strong password]`
   - Region: `[closest to you]`
4. Click **"Create new project"**
5. ⏳ Wait 2-3 minutes for setup

#### 2.2 Get Your Credentials

1. In Supabase Dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJh...`
   - **service_role secret key**: `eyJh...`

#### 2.3 Run Database Migrations

1. In Supabase Dashboard, click **SQL Editor**
2. Click **"New query"**
3. Open `supabase/migrations.sql` from this project
4. Copy entire content and paste into SQL Editor
5. Click **"Run"**
6. ✅ You should see "Success. No rows returned"

#### 2.4 Create Storage Bucket

1. Click **Storage** in sidebar
2. Click **"New bucket"**
3. Name: `whatsapp-media`
4. Public: ❌ **OFF**
5. Click **"Create bucket"**

---

### Step 3: Configure Environment Variables (2 minutes)

```bash
# Copy the example environment file
cp .env.example .env
```

Open `.env` in your code editor and fill in:

```env
# From Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Generate a 32-character random string
ENCRYPTION_KEY=generate-random-32-char-string-here
```

**Generate encryption key** (run in terminal):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste as `ENCRYPTION_KEY`.

---

### Step 4: Test Your Setup (1 minute)

```bash
npm run test:supabase
```

**Expected output:**
```
🔍 Testing Supabase connection...

Test 1: Basic Connection
✅ Connection successful

Test 2: Verify Tables
✅ Table 'sessions' exists
✅ Table 'messages' exists

...

========================================
✅ All tests passed!
========================================
```

❌ **If tests fail**, see [Troubleshooting](#troubleshooting) below.

---

### Step 5: Start the Application (1 minute)

```bash
npm run dev
```

**Expected output:**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
event - compiled client and server successfully
```

🎉 **Open your browser** to [http://localhost:3000](http://localhost:3000)

---

## 🧪 Test the Application (5 minutes)

### Test 1: Create Account

1. Click **"Get Started"** or **"Sign Up"**
2. Enter:
   - Email: `test@example.com`
   - Password: `password123` (minimum 6 characters)
3. Click **"Create Account"**
4. ✅ You should be redirected to the dashboard

### Test 2: Create WhatsApp Session

1. Click **"New Session"**
2. Enter session name: `My WhatsApp`
3. Click **"Create"**
4. ✅ You should see a QR code

### Test 3: Connect WhatsApp

1. Open **WhatsApp** on your phone
2. Go to **Settings** > **Linked Devices**
3. Tap **"Link a Device"**
4. Scan the QR code on your screen
5. ✅ Page should update to show "Connected"

### Test 4: Send a Message

1. Enter a phone number (with country code, no +)
   - Example: `1234567890` for US number
2. Type a message: `Hello from WhatsApp Web Integration!`
3. Click **"Send"**
4. ✅ Message should appear in the chat
5. ✅ Check your phone - message should be sent

### Test 5: Receive a Message

1. From another device, send a WhatsApp message to your connected number
2. ✅ Message should appear in the web interface in real-time

---

## 🐳 Docker Deployment (Optional)

If you prefer Docker:

```bash
# Copy .env file
cp .env.example .env
# Edit .env with your credentials

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Access at [http://localhost:3000](http://localhost:3000)

---

## 🔧 Troubleshooting

### Problem: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Problem: Supabase connection test fails

**Check:**
1. Is `.env` file in the project root?
2. Are credentials correct? (no extra spaces)
3. Is Supabase project active and not paused?
4. Is internet connection working?

**Solution:**
```bash
# Verify .env file
cat .env

# Test connection manually
node scripts/test-supabase.js
```

### Problem: QR code doesn't appear

**Check:**
1. Did migrations run successfully?
2. Is session created in Supabase (check Database > Tables > sessions)?
3. Check browser console for errors (F12)

**Solution:**
```bash
# Restart server
# Press Ctrl+C to stop
npm run dev
```

### Problem: Messages not sending

**Check:**
1. Is WhatsApp connected? (check session status)
2. Is phone number format correct? (no + symbol, just digits)
3. Is internet connection stable?

**Solution:**
- Disconnect and reconnect WhatsApp session
- Check phone number format: `1234567890` (country code + number)

### Problem: Real-time updates not working

**Check:**
1. Is Realtime enabled for `messages` table?
   - Go to Supabase > Database > Replication
   - Enable for `messages` table

**Solution:**
```bash
# Refresh the page
# Real-time subscriptions reinitialize on page load
```

---

## 📱 Usage Tips

### How to format phone numbers

- ✅ Correct: `1234567890` (country code + number, no +)
- ✅ Correct: `971501234567` (UAE example)
- ❌ Wrong: `+1234567890` (don't include +)
- ❌ Wrong: `123-456-7890` (no dashes)

### How to manage sessions

- **Create multiple sessions**: Each user can have multiple WhatsApp sessions
- **Disconnect**: Click "Disconnect" button in chat page
- **Reconnect**: Create a new session and scan QR again

### How to view message history

- All messages are saved in Supabase `messages` table
- Access via chat interface
- Filter by chat_id to see conversation with specific contact

---

## 🎓 What's Next?

Now that you have the app running:

1. ✅ **Explore the code** - Check out the [Project Structure](./README.md#project-structure)
2. ✅ **Read the docs** - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for advanced configuration
3. ✅ **Customize** - Modify UI colors in `tailwind.config.js`
4. ✅ **Deploy** - See deployment guides for Vercel/Netlify/Docker
5. ✅ **Contribute** - Submit issues or pull requests on GitHub

---

## 📚 Additional Resources

- [Main README](./README.md) - Full documentation
- [Supabase Setup Guide](./SUPABASE_SETUP.md) - Detailed Supabase configuration
- [Next.js Docs](https://nextjs.org/docs) - Learn Next.js
- [Supabase Docs](https://supabase.com/docs) - Learn Supabase
- [whatsapp-web.js Guide](https://wwebjs.dev/guide) - WhatsApp library docs

---

## 🆘 Need Help?

- 🐛 **Found a bug?** [Open an issue](../../issues/new)
- 💬 **Have a question?** [Start a discussion](../../discussions)
- 📧 **Contact**: See repository for contact information

---

**Happy Coding! 🎉**

Made with ❤️ for developers who love to build cool stuff.
