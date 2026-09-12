# Placement Referee

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-forestgreen.svg)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-orange.svg)](https://ai.google.dev/)

> **Two candidates. One role. One neutral referee.**  
> *Don't ask who feels stronger. Ask what the evidence says.*

---

## 🎯 The Core Problem

Two students are preparing for the same placement opportunity at the same company.  
Both feel confident. Yet neither has a reliable, objective signal about who actually has stronger evidence for:
- **That exact company**
- **That exact role**
- **That exact placement context**

Friends can't reliably judge. Internet advice is too generic. Traditional ATS systems produce arbitrary numbers without context, and resume scrapers focus on buzzword frequency rather than demonstrated capability.

**Placement Referee** is the neutral, analytical system that evaluates verifiable evidence and answers:
> *"For THIS role at THIS company, who currently has the stronger evidence of fit — and why?"*

---

## ⚖️ Core Product Principles

1. **Compare Evidence, Not Confidence**: Evaluate only what the candidate's submitted materials demonstrate.
2. **No Mandatory Second Resume**:
   - **Mode A (Solo Referee)**: A student can submit solely their own resume and opportunity details. The referee produces a complete evidence breakdown, strengths, gaps, what actually matters, and what to ignore.
   - **Mode B (Head-to-Head Referee)**: If a peer or competitor's resume is available, it can be attached immediately or days later to conduct a true pairwise comparison.
3. **No Forced Winners & No False Precision**:
   - The referee explicitly supports **"Too close to call (Tie)"** when evidence is balanced.
   - No meaningless decimals (e.g. 87.42 vs 86.91).
4. **Not a Hiring Predictor**:
   - The referee evaluates submitted evidence; it does not claim to know internal company secrets or predict interview outcomes.
5. **Transparency on Unobserved Factors**:
   - Explicitly notes what the referee cannot observe (live coding performance, behavioral communication, system design under interview pressure).
6. **Zero Resume Fabrication**:
   - Constructive suggestions clearly remind students: *"Only add if you genuinely have this experience."*

---

## 🚀 Two Operating Modes

```
               ┌────────────────────────────────────────┐
               │         THE OPPORTUNITY DETAILS        │
               │  Company • Role • Context • Requirements│
               └───────────────────┬────────────────────┘
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │  CANDIDATE A RESUME   │
                       │   (Your Evidence)     │
                       └───────────┬───────────┘
                                   │
             ┌─────────────────────┴─────────────────────┐
             ▼                                           ▼
   [MODE A: SOLO REFEREE]                      [MODE B: HEAD-TO-HEAD]
   • Overall Role Fit Assessment               • The Referee's Call (A / B / Tie)
   • What You Already Prove                    • 2–5 Decisive Differences
   • Where Strong vs Where Weak                • Side-by-Side Candidate Cards
   • Requirement-by-Requirement Mapping        • Requirement Comparison Matrix
   • What Actually Matters                     • What Neither Should Overthink
   • What You Shouldn't Overthink              • What Could Change the Call
   • Realistic Improvements                    • Unobserved Factors & Limitations
   └───────────────────────┬───────────────────┘
                           │ (Add Candidate B later)
                           ▼
               [Upgraded to Head-to-Head]
```

### Mode A — Solo Referee
A student submits:
- Company name (e.g. Google)
- Role title (e.g. Software Engineer)
- Recruitment context (Campus placement, Internship, Off-campus, Graduate hiring)
- Job description, manual requirements, or job URL
- Candidate A resume (PDF, DOCX, TXT)

The referee immediately evaluates role fit, mapping candidate evidence against critical and high-priority requirements.

### Mode B — Head-to-Head Referee
When Candidate B is attached:
- Conducts an impartial pairwise comparison for the exact same role.
- Verdict options:
  - `Candidate A currently has the stronger evidence`
  - `Candidate B currently has the stronger evidence`
  - `Too close to call (Tie)`
  - `Insufficient evidence to determine an edge`
- Surfaces 2 to 5 **decisive differences** that carry genuine weight.
- Identifies **what neither candidate should overthink** to reduce anxiety.

---

## 🏗️ Technical Architecture

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS 3 | Fast client-side SPA with glassmorphic dark theme |
| **Animation & Motion** | Framer Motion | Smooth state transitions, multi-stage processing |
| **Icons & UI** | Lucide React, React Dropzone | File dropzones and clean UI components |
| **Backend** | Node.js, Express (ES Modules) | RESTful API server with JWT authentication |
| **Database** | MongoDB Atlas + Mongoose | User-scoped persistence for cases, resumes, screenings |
| **LLM Engine** | Google Gemini (with Multi-Key Pool) | Structured JSON generation with automatic quota rotation |
| **Text Extraction** | Unstract LLMWhisperer + Resilient Local Fallback | High-fidelity parsing of PDF, DOCX, and TXT resumes |
| **Deployment** | Vercel (Frontend) + Render (Backend) | Zero-friction production hosting |

---

## 🛡️ Case Lifecycle & Performance Protection

- **Case States**: `draft` → `solo_completed` → `comparing` → `completed`
- **Cached Persistence**: Once analyzed, referee cases are stored in MongoDB Atlas. Accessing or refreshing `/referee/:id` performs a pure database read and **never calls Gemini again**, conserving API quota.
- **Asynchronous Head-to-Head Upgrade**: A user can generate a Solo assessment on Day 1, log off, return on Day 3, click **"Add Candidate B"**, and upgrade the existing case into a Head-to-Head call without starting over.

---

## 📡 REST API Reference

### Placement Referee Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/referee/solo` | Upload Candidate A resume + opportunity details to create & analyze a solo case | Optional/JWT |
| `POST` | `/api/referee/:id/candidate-b` | Upload Candidate B resume to upgrade existing case to head-to-head | Optional/JWT |
| `GET` | `/api/referee` | List all referee cases belonging to the user (for Case History) | Optional/JWT |
| `GET` | `/api/referee/:id` | Retrieve persisted referee case by ID (cached, 0 LLM calls) | Optional/JWT |
| `DELETE` | `/api/referee/:id` | Delete a referee case record | Optional/JWT |
| `POST` | `/api/referee/fetch-url` | Fetch and extract public role text from a job URL | Optional/JWT |

### Retained Legacy Endpoints
- `/api/resumes`: Bulk resume uploads and retrieval
- `/api/jobs`: Legacy job description management
- `/api/screen`: Legacy applicant scoring and rankings
- `/api/analyze`: Single-resume interactive keyword intelligence
- `/api/v1/auth`: User registration, JWT login, and Google OAuth

---

## 💻 Local Development Setup

### 1. Clone & Prerequisites
Ensure you have **Node.js v18+** installed.

```bash
git clone https://github.com/your-repo/placement-referee.git
cd placement-referee
```

### 2. Configure Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your values:
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/placement_referee
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

### 3. Configure Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Production Deployment

### Backend (Render)
1. Create a new **Web Service** on [Render](https://render.com/).
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables:
   - `GEMINI_API_KEY`: Your Gemini API key (or multiple: `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`)
   - `MONGODB_URI`: Your MongoDB Atlas connection URI (`mongodb+srv://...`)
   - `JWT_SECRET`: Random 64-character string
   - `ALLOWED_ORIGINS`: `https://your-app.vercel.app`

### Frontend (Vercel)
1. Import project to [Vercel](https://vercel.com/).
2. Root Directory: `frontend`
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com` (no trailing slash)
   - `VITE_GOOGLE_CLIENT_ID`: (Optional) Google OAuth Client ID

---

## 📄 License
Released under the MIT License.
