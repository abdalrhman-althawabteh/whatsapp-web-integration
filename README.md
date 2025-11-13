# WhatsApp Web Integration 📱

> **[English](#english) | [العربية](#arabic)**

---

<a name="english"></a>

## 🚀 WhatsApp Web Integration - MVP

A complete web application for connecting personal WhatsApp accounts via QR code scanning, built with Next.js and Supabase.

### ⚠️ **IMPORTANT LEGAL NOTICE**

**This is a Proof-of-Concept (PoC) project for educational and demonstration purposes only.**

- ✅ For **educational purposes** and **personal experimentation**
- ❌ **NOT for commercial use** without proper authorization
- 📋 For commercial applications, use the **official [WhatsApp Business API](https://www.whatsapp.com/business/api)**
- 👥 Always obtain **user consent** before accessing their data
- 📜 Comply with **WhatsApp's Terms of Service** and **local data protection laws**
- ⚖️ The developers are **not responsible** for any misuse of this software

### 🎯 Features (MVP)

- ✅ **User Authentication** - Email/password signup and login via Supabase Auth
- ✅ **QR Code Scanning** - Connect WhatsApp account by scanning QR code
- ✅ **Real-time Chat** - Send and receive messages with live updates (Supabase Realtime)
- ✅ **Session Management** - Create, manage, and disconnect WhatsApp sessions
- ✅ **Message History** - View conversation history
- ✅ **Media Support** - Basic image support with Supabase Storage
- ✅ **Secure Storage** - Encrypted session data in Supabase
- ✅ **Docker Support** - Easy deployment with Docker Compose
- ✅ **Rate Limiting** - API protection against abuse

### 🛠️ Technology Stack

| Component | Technology | Reason |
|-----------|-----------|--------|
| **Frontend** | Next.js + React | Modern, SSR-capable, great DX |
| **Styling** | Tailwind CSS | Rapid UI development |
| **Backend** | Next.js API Routes | Unified codebase, simpler deployment |
| **Database** | Supabase (PostgreSQL) | Managed DB with built-in auth |
| **Authentication** | Supabase Auth | Secure, built-in user management |
| **Real-time** | Supabase Realtime | Direct DB integration, no Socket.IO needed |
| **Storage** | Supabase Storage | Media file management |
| **WhatsApp** | whatsapp-web.js | Stable, well-documented, active community |
| **Encryption** | CryptoJS (AES-256) | Session data protection |
| **Containerization** | Docker + Docker Compose | Easy deployment and scaling |

### 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Supabase Account** (free tier works)
- **Docker** (optional, for containerized deployment)

### 🚀 Quick Start

See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions.

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd whatsapp-web-integration

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Set up Supabase (see SUPABASE_SETUP.md)
npm run test:supabase

# 5. Start development server
npm run dev

# 6. Open http://localhost:3000
```

### 📁 Project Structure

```
whatsapp-web-integration/
├── pages/                    # Next.js pages
│   ├── api/                 # API routes
│   │   └── session/        # Session management endpoints
│   ├── chat/[id].js        # Chat interface
│   ├── dashboard.js        # Sessions dashboard
│   ├── login.js            # Login page
│   └── signup.js           # Signup page
├── src/
│   ├── components/         # React components
│   │   ├── ChatWindow.js
│   │   ├── QRScanner.js
│   │   ├── MessageBubble.js
│   │   └── SessionCard.js
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.js
│   │   └── useRealtime.js
│   ├── lib/                # Core libraries
│   │   ├── supabase.js
│   │   └── encryption.js
│   └── utils/              # Utilities
│       ├── whatsapp/
│       │   └── connector.js
│       ├── rate-limiter.js
│       └── media-handler.js
├── supabase/
│   └── migrations.sql      # Database schema
├── scripts/
│   └── test-supabase.js   # Supabase connectivity test
├── docker-compose.yml      # Docker orchestration
├── Dockerfile             # Container definition
└── README.md              # This file
```

### 🔧 Configuration

See `.env.example` for all required environment variables:

- **Supabase**: URL, anon key, service role key
- **Encryption**: 32-character encryption key
- **Rate Limiting**: Window and max requests
- **Storage**: Media bucket name

### 🧪 Testing

```bash
# Test Supabase connection
npm run test:supabase

# Run all tests
npm test
```

### 🐳 Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

### ☁️ Cloud Deployment

#### Vercel (Frontend + API)

⚠️ **Note**: Vercel has limitations for WhatsApp sessions (serverless, no persistent storage). Better for testing/demo.

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete guide.

Quick steps:
1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables (Supabase credentials, encryption key)
4. Deploy

#### Recommended for Production:

- **Railway** - Best for persistent WhatsApp sessions
- **DigitalOcean App Platform** - Good for stateful apps
- **AWS ECS/EC2** - Full control
- **Self-hosted VPS** - Most reliable for WhatsApp

### 📚 Documentation

- [QUICK_START.md](./QUICK_START.md) - Step-by-step setup guide
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Detailed Supabase configuration
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Deploy to Vercel
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

### 🔒 Security Considerations

- Session data is encrypted with AES-256 before storage
- Row Level Security (RLS) enabled on all database tables
- Rate limiting on API endpoints
- No secrets in code (use environment variables)
- HTTPS recommended for production

### ⚠️ Known Limitations

- **Unofficial API**: Uses `whatsapp-web.js` which is not officially supported by WhatsApp
- **Breaking Changes**: May break when WhatsApp updates their web client
- **Single Device**: Each session can only be used on one device at a time
- **Media**: Currently supports images only (MVP scope)
- **No Voice/Video**: Text and image messages only in MVP

### 🗺️ Roadmap

- [ ] Support for more media types (video, audio, documents)
- [ ] Group chat support
- [ ] Voice/video call notifications
- [ ] Message search functionality
- [ ] Export chat history
- [ ] Multi-language support
- [ ] Analytics dashboard

### 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

### 📝 License

MIT License - see LICENSE file for details

### 👥 Support

For issues and questions:
- GitHub Issues: [Create an issue](../../issues)
- Documentation: See docs folder

---

<a name="arabic"></a>

## 🚀 تكامل واتساب ويب - النسخة الأولية

تطبيق ويب كامل لربط حسابات واتساب الشخصية عبر مسح رمز QR، مبني بـ Next.js و Supabase.

### ⚠️ **تحذير قانوني مهم**

**هذا مشروع إثبات مفهوم (PoC) لأغراض تعليمية وتوضيحية فقط.**

- ✅ للأغراض **التعليمية** و **التجريب الشخصي**
- ❌ **ليس للاستخدام التجاري** بدون ترخيص مناسب
- 📋 للتطبيقات التجارية، استخدم **[WhatsApp Business API الرسمي](https://www.whatsapp.com/business/api)**
- 👥 احصل دائماً على **موافقة المستخدم** قبل الوصول لبياناته
- 📜 التزم بـ **شروط خدمة واتساب** و **قوانين حماية البيانات المحلية**
- ⚖️ المطورون **غير مسؤولين** عن أي سوء استخدام لهذا البرنامج

### 🎯 المميزات (النسخة الأولية)

- ✅ **مصادقة المستخدمين** - تسجيل ودخول بالبريد الإلكتروني عبر Supabase Auth
- ✅ **مسح رمز QR** - ربط حساب واتساب بمسح رمز QR
- ✅ **دردشة فورية** - إرسال واستقبال رسائل مع تحديثات مباشرة (Supabase Realtime)
- ✅ **إدارة الجلسات** - إنشاء وإدارة وفصل جلسات واتساب
- ✅ **سجل الرسائل** - عرض تاريخ المحادثات
- ✅ **دعم الوسائط** - دعم أساسي للصور مع Supabase Storage
- ✅ **تخزين آمن** - بيانات جلسة مشفرة في Supabase
- ✅ **دعم Docker** - نشر سهل مع Docker Compose
- ✅ **تحديد المعدل** - حماية API ضد الإساءة

### 🛠️ المتطلبات

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **حساب Supabase** (الطبقة المجانية تعمل)
- **Docker** (اختياري، للنشر في حاويات)

### 🚀 البدء السريع

راجع [QUICK_START.md](./QUICK_START.md) للحصول على تعليمات الإعداد التفصيلية.

```bash
# 1. استنساخ المستودع
git clone <your-repo-url>
cd whatsapp-web-integration

# 2. تثبيت التبعيات
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env
# عدّل .env ببيانات Supabase الخاصة بك

# 4. إعداد Supabase (راجع SUPABASE_SETUP.md)
npm run test:supabase

# 5. تشغيل خادم التطوير
npm run dev

# 6. افتح http://localhost:3000
```

### 📚 الوثائق

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - إعداد Supabase المفصل
- [QUICK_START.md](./QUICK_START.md) - دليل الإعداد خطوة بخطوة

### 📝 الترخيص

ترخيص MIT - راجع ملف LICENSE للتفاصيل

---

**Built with ❤️ for the developer community**
