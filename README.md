# 🚀 FocusPulse AI — Digital Habit Tracking & Wellness Platform

> An advanced AI-powered digital wellness platform that tracks, analyzes, and improves your digital habits using GPT-4.

![FocusPulse AI](https://img.shields.io/badge/FocusPulse-AI%20Powered-6366f1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)

---

## 📁 Project Structure

```
Digital Habit Tracker/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/            # Route handlers
│   │   ├── auth.controller.js
│   │   ├── habit.controller.js
│   │   ├── analytics.controller.js
│   │   ├── ai.controller.js
│   │   ├── goal.controller.js
│   │   ├── focus.controller.js
│   │   ├── notification.controller.js
│   │   ├── user.controller.js
│   │   ├── admin.controller.js
│   │   └── report.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT protection
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   ├── models/                 # Mongoose schemas
│   │   ├── User.model.js
│   │   ├── Habit.model.js
│   │   ├── Goal.model.js
│   │   ├── FocusSession.model.js
│   │   ├── AIReport.model.js
│   │   ├── Notification.model.js
│   │   └── ProductivityScore.model.js
│   ├── routes/                 # Express routers
│   ├── utils/
│   │   ├── sendEmail.js
│   │   ├── scoreCalculator.js
│   │   └── mockDataGenerator.js
│   ├── server.js               # Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/                   # Next.js 14 App
    ├── components/
    │   └── layout/
    │       └── DashboardLayout.js
    ├── lib/
    │   └── api.js              # Axios client
    ├── pages/
    │   ├── index.js            # Landing page
    │   ├── login.js
    │   ├── register.js
    │   ├── forgot-password.js
    │   ├── dashboard.js
    │   ├── analytics.js
    │   ├── ai-insights.js
    │   ├── focus.js
    │   ├── goals.js
    │   ├── notifications.js
    │   ├── profile.js
    │   ├── settings.js
    │   └── admin.js
    ├── store/
    │   └── authStore.js        # Zustand state
    ├── styles/
    │   └── globals.css
    ├── .env.local.example
    ├── next.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- OpenAI API key (optional — falls back to rule-based insights)

---

### 1. Clone & Setup

```bash
# Navigate to project
cd "Digital Habit Tracker"
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env
# Edit .env with your values (see Environment Variables section)

# Start development server
npm run dev
```

Backend runs on: `http://localhost:5000`
Health check: `http://localhost:5000/health`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.local.example .env.local
# Edit .env.local

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/focuspulse

# JWT secrets (use long random strings)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRE=30d

# Email (Gmail with App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=FocusPulse AI <noreply@focuspulse.ai>

# OpenAI (optional - falls back to rule-based)
OPENAI_API_KEY=sk-your-key-here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=FocusPulse AI
```

---

## 🎮 Demo Data

After registering, go to the Dashboard and click **"Seed Demo Data"** to populate 30 days of realistic mock data. This lets you explore all features immediately.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/habits/today` | Today's habit data |
| POST | `/api/habits/seed-demo` | Seed 30 days of demo data |
| GET | `/api/analytics/overview` | Dashboard overview |
| GET | `/api/analytics/weekly` | Weekly chart data |
| GET | `/api/analytics/heatmap` | Activity heatmap |
| GET | `/api/ai/insights` | AI-powered insights |
| POST | `/api/ai/weekly-report` | Generate weekly AI report |
| GET | `/api/ai/addiction-score` | Digital addiction risk score |
| POST | `/api/ai/chat` | Chat with AI coach |
| POST | `/api/focus/start` | Start focus session |
| PUT | `/api/focus/:id/complete` | Complete session |
| GET | `/api/goals` | Get all goals |
| POST | `/api/goals` | Create goal |
| GET | `/api/admin/stats` | Platform stats (admin only) |

---

## 🚀 Deployment

### Backend → Render

1. Push backend to GitHub
2. Create new Web Service on [render.com](https://render.com)
3. Set environment variables in Render dashboard
4. Deploy

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set `NEXT_PUBLIC_API_URL` to your Render backend URL.

### Database → MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user
3. Whitelist IP (0.0.0.0/0 for production)
4. Copy connection string to `MONGODB_URI`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| State | Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| AI | OpenAI GPT-4o-mini |
| Email | Nodemailer |
| Deployment | Vercel + Render + MongoDB Atlas |

---

## 📊 Features

- ✅ JWT Authentication with refresh tokens
- ✅ Password reset via email
- ✅ 30-day demo data seeding
- ✅ Real-time analytics dashboard
- ✅ Weekly/monthly/trend charts
- ✅ App usage tracking
- ✅ Hourly activity heatmap
- ✅ AI-powered insights (GPT-4)
- ✅ Weekly AI reports
- ✅ Digital addiction risk score
- ✅ AI chat coach
- ✅ Pomodoro focus timer
- ✅ Focus session history
- ✅ Habit goals with progress tracking
- ✅ Streak system with gamification
- ✅ In-app notifications
- ✅ Admin dashboard
- ✅ Responsive dark UI with glassmorphism
- ✅ Smooth Framer Motion animations

---

Built with ❤️ as a final-year project & startup MVP showcase.
