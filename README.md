# 🧠 ICR System — Intelligent Code Review System

A production-grade, AI-powered code review platform that integrates with GitHub to analyze your codebase for **security vulnerabilities**, **performance bottlenecks**, **code smells**, and **style issues** — with actionable, AI-generated fixes for every problem found.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933)
![AI](https://img.shields.io/badge/AI-Multi--Model-a855f7)

---

## ✨ Key Features

### 🤖 Multi-Model AI Analysis
- **Gemini 2.5 Flash** — Fast, accurate reviews via Google AI
- **GPT-4o Mini** — Deep understanding from OpenAI
- **Claude 3.5 Sonnet** — Safety-focused analysis from Anthropic
- **Llama 3.3 70B (Groq)** — Lightning-fast open-source inference

### 🔒 Security Auditing
Detects hardcoded secrets, SQL injection, XSS, `eval()` usage, insecure cryptography, exposed API keys, and CORS misconfigurations.

### ⚡ Performance Analysis
Identifies O(n²) bottlenecks, memory leaks, N+1 queries, unnecessary re-renders, and suggests optimal Time & Space complexity improvements.

### 📊 Visual Analytics Dashboard
- Interactive **category bar charts** (Security, Performance, Complexity, Smell, Style)
- **Severity distribution** pie charts (Critical, High, Medium, Low)
- **Score trend** line charts across commits
- **Quick stats** badges per analysis

### 🔔 Real-time Notifications
- Bell icon with **unread count badge**
- Dropdown showing recent analyses with **score grades** (A+, A, B, C, F)
- One-click navigation to detailed analysis results
- Auto-polls every 30 seconds

### 🔗 GitHub Integration
- **OAuth sign-in** and **account linking**
- Connect **multiple GitHub accounts**
- Browse and analyze **any repository**
- Automated **PR comments** on webhook triggers

### 🏢 Organization Support
- Create and join organizations
- Role-based access (Owner, Admin, Member, Viewer)
- Shared repository analysis across teams

### 🎯 Smart Analysis Features
- **Re-analysis support** — Force a fresh analysis on any commit
- **Fallback engine** — Static rule-based analysis when AI is unavailable
- **Multi-language** — JavaScript, TypeScript, Python, Java, Go, Rust, SQL, CSS, HTML, and 50+ file types
- **Expandable suggestions** — See AI-recommended fixes inline

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, TanStack Query, Recharts, Lucide Icons |
| **Styling** | Tailwind CSS 4, Custom CSS Variables, Glassmorphism |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Cache/Queue** | Redis + BullMQ |
| **AI Providers** | Google Gemini, OpenAI, Anthropic, Groq |
| **Auth** | JWT (1-day expiry), GitHub OAuth 2.0, bcrypt |
| **DevOps** | Docker Compose, Vite, tsx (dev runner) |

---

## 📁 Project Structure

```
code-review-system/
├── backend/
│   ├── prisma/              # Database schema & migrations
│   ├── src/
│   │   ├── analyzers/       # Analysis engine
│   │   │   ├── providers/   # AI provider adapters (Gemini, OpenAI, Claude, Groq)
│   │   │   ├── index.ts     # Orchestrator (AI-first with static fallback)
│   │   │   ├── llm.analyzer.ts
│   │   │   ├── complexity.analyzer.ts
│   │   │   ├── security.analyzer.ts
│   │   │   ├── smell.analyzer.ts
│   │   │   ├── style.analyzer.ts
│   │   │   └── duplication.analyzer.ts
│   │   ├── config/          # Database & Passport config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, cache middleware
│   │   ├── routes/          # Express routes
│   │   ├── services/        # GitHub API service & fetcher
│   │   ├── workers/         # BullMQ analysis worker
│   │   └── app.ts           # Express app entry
│   ├── docker-compose.yml   # PostgreSQL + Redis
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API clients
│   │   ├── components/      # Reusable UI components
│   │   │   ├── layout/      # Sidebar, Header, Layout
│   │   │   ├── ui/          # Card, Button primitives
│   │   │   ├── IssueList.tsx
│   │   │   └── ScoreCard.tsx
│   │   ├── pages/           # Route pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── RepoDetails.tsx
│   │   │   ├── AnalysisView.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── ...
│   │   └── App.tsx           # Router & auth guards
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **Docker Desktop** (for PostgreSQL & Redis)
- **GitHub OAuth App** (for authentication)
- **AI API Key** (Gemini, OpenAI, Anthropic, or Groq)

### 1. Clone the Repository

```bash
git clone https://github.com/Riyash1405/code-review-system.git
cd code-review-system
```

### 2. Start Database & Redis

```bash
docker-compose up -d
```

### 3. Configure Backend

```bash
cd backend
cp .env.example .env  # or create .env manually
npm install
npx prisma migrate dev
npx prisma generate
```

**Required `.env` variables:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/code_review_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key  # Optional — users can set their own in Settings
```

### 4. Configure Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env` (optional):
```env
VITE_BACKEND_URL=http://localhost:3001/api
```

### 5. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

---

## 🔑 Authentication Flow

1. **Register** with email + password, or **Sign in with GitHub**
2. **Link GitHub accounts** in Settings → each account's repos become available
3. **JWT tokens** expire after **1 day** — users must re-login after inactivity
4. **OAuth consent** is forced on every link, preventing accidental account auto-linking

---

## 🧪 How Analysis Works

```
User clicks "Analyze" → Backend creates BullMQ job
                       → Worker fetches repo source code via GitHub API
                       → Code sent to AI provider (Gemini/GPT-4/Claude/Groq)
                       → AI returns JSON with score, issues, severity, suggestions
                       → Results stored in PostgreSQL
                       → Frontend polls and displays results
```

**If AI fails** (rate limit, bad JSON, etc.), the system automatically falls back to the **rule-based static analyzer** which checks complexity, security, code smells, style, and duplication.

---

## 📸 Pages Overview

| Page | Description |
|------|-------------|
| **Landing Page** | Public marketing page with features, AI models, tech stack, and creator info |
| **Login / Register** | Email+password or GitHub OAuth sign-in |
| **Dashboard** | Grid of all repositories from connected GitHub accounts |
| **Repository Details** | Commit history, score trend chart, analyze buttons |
| **Analysis View** | Score card, category bar chart, severity pie chart, filterable issue list with expandable AI suggestions |
| **Settings** | Manage GitHub accounts, select AI provider, configure API key |
| **Organizations** | Create/join orgs, role management |

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Email + password registration |
| `POST` | `/api/auth/login` | Email + password login |
| `GET` | `/api/auth/github` | GitHub OAuth quick-start |
| `GET` | `/api/repos` | List all repos from connected accounts |
| `GET` | `/api/repos/:owner/:repo` | Repository details + recent analyses |
| `GET` | `/api/repos/:owner/:repo/commits` | Commit history |
| `POST` | `/api/repos/:owner/:repo/analyze` | Trigger analysis (supports `force: true`) |
| `GET` | `/api/repos/:owner/:repo/analysis/:sha` | Get analysis results |
| `GET` | `/api/repos/notifications/recent` | Recent analyses for notification bell |
| `PUT` | `/api/user/settings` | Update AI provider & API key |

---

## 👨‍💻 Developer

**Riyash Patel** — Full-Stack Developer

Designed and built the entire ICR System from scratch — backend architecture, multi-model AI integration pipeline, real-time BullMQ analysis engine, and the modern React dashboard.

- GitHub: [@Riyash1405](https://github.com/Riyash1405)

---

## 📄 License

This project is licensed under the MIT License.