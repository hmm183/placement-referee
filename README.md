# ⚖️ Placement Referee

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-forestgreen.svg)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-orange.svg)](https://ai.google.dev/)
[![Frontend Status](https://img.shields.io/badge/Vercel-Live-brightgreen.svg)](https://frontend-omega-inky-86.vercel.app/)
[![Backend Status](https://img.shields.io/badge/Render-Active-brightgreen.svg)](https://placement-referee.onrender.com/health)

### **Two candidates. One role. One neutral referee.**
*Don't ask who feels stronger. Ask what the evidence says.*

[**🌐 Live Application**](https://frontend-omega-inky-86.vercel.app/) • [**📡 Backend API**](https://placement-referee.onrender.com/health) • [**📂 GitHub Repository**](https://github.com/hmm183/placement-referee)

</div>

---

## 📌 Table of Contents
- [The Human Problem](#-the-human-problem)
- [Core Value Proposition](#-core-value-proposition)
- [Two Operating Modes](#-two-operating-modes)
  - [Mode A: Solo Referee](#mode-a--solo-referee)
  - [Mode B: Head-to-Head Referee](#mode-b--head-to-head-referee)
- [Impartial Referee Protocol](#-impartial-referee-protocol)
- [System Architecture](#-system-architecture)
- [Case Lifecycle & Persistence](#-case-lifecycle--persistence)
- [REST API Reference](#-rest-api-reference)
- [Local Development Setup](#-local-development-setup)
- [Production Deployment Guide](#-production-deployment-guide)
  - [Backend Deployment (Render)](#backend-deployment-render)
  - [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
  - [Google OAuth Client Setup](#google-oauth-client-setup)
- [Keeping Backend Awake (Free Tier Cron)](#-keeping-backend-awake-free-tier-cron)
- [Fairness & Ethical Framework](#-fairness--ethical-framework)
- [License](#-license)

---

## 💡 The Human Problem

Two students are preparing for the exact same placement or internship opportunity at the exact same company.  
Both are confident. Both have spent months preparing.  
Yet neither has a reliable, objective signal about who actually demonstrates stronger evidence for:
- **That exact company**
- **That exact role**
- **That exact placement cycle**

Friends can’t reliably judge. Professors aren't familiar with every company's stack. Generic internet advice is too vague. Traditional ATS tools generate arbitrary percentage scores based on keyword repetition rather than verified capability.

**Placement Referee** is the neutral, evidence-driven evaluation engine that answers:
> *"For THIS role at THIS company, who currently has the stronger evidence of fit — and why?"*

---

## 🎯 Core Value Proposition

> **"Compare the evidence, not the confidence."**

Placement Referee is **NOT**:
- ❌ A generic applicant tracking system (ATS)
- ❌ A superficial keyword-matching resume scorer
- ❌ A recruitment agency or job board
- ❌ A resume writer encouraging keyword stuffing
- ❌ A fake recruiter simulator with arbitrary hiring percentages

Placement Referee **IS**:
- ✅ An impartial referee that conducts rigorous evidence inspection.
- ✅ A transparent reviewer that distinguishes between verified proof, indirect coursework, and absent evidence.
- ✅ An anxiety-reducing coach that explicitly tells candidates **what actually matters** vs. **what they should NOT overthink**.
- ✅ A calibrated judge that refuses false precision and declares a **Tie** when evidence is balanced.

---

## ⚡ Two Operating Modes

```
               ┌────────────────────────────────────────────────────────┐
               │                 THE OPPORTUNITY SCOPE                  │
               │   Company • Role • Recruitment Context • Requirements   │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
                               ┌───────────────────────┐
                               │  CANDIDATE A RESUME   │
                               │   (Your Evidence)     │
                               └───────────┬───────────┘
                                           │
             ┌─────────────────────────────┴─────────────────────────────┐
             ▼                                                           ▼
   [MODE A: SOLO REFEREE]                                      [MODE B: HEAD-TO-HEAD]
   • Role Fit Assessment (Strong / Good / Moderate / Weak)     • The Referee's Call (A / B / Tie)
   • What You Already Prove                                    • 2–5 Decisive Differences
   • Where Strong vs Where Evidence is Weak                    • Side-by-Side Candidate Cards
   • Requirement-by-Requirement Evidence Breakdown             • Requirement Comparison Matrix
   • What Actually Matters for this Role                       • What Neither Should Overthink
   • What You Shouldn't Overthink                              • What Could Change the Call
   • Realistic Opportunities to Strengthen Proof               • Unobserved Factors & Limitations
   └───────────────────────────────┬───────────────────────────┘
                                   │ (Attach Candidate B at any time)
                                   ▼
                   [Upgraded to Head-to-Head Call]
```

### Mode A — Solo Referee
**No second resume required.** A student can evaluate their own evidence independently.
1. Enter target company, role title, recruitment context (Campus placement, Internship, Off-campus, Graduate hiring), and requirements.
2. Upload Candidate A resume (`.pdf`, `.docx`, `.txt`).
3. Receive a detailed Solo Assessment:
   - **Role Fit Assessment**: Qualitative classification (`Strong`, `Good`, `Moderate`, `Weak`, `Insufficient evidence`).
   - **What You Already Prove**: Verifiable technical capabilities directly evidenced in the resume.
   - **Where Strong vs Where Weak**: Concrete strengths and high-impact gaps.
   - **Requirement Breakdown**: Critical, high, and medium priority requirements tagged as `Explicit Proof`, `Indirect Mention`, or `No Evidence Found`.
   - **What Actually Matters**: The 2–4 competencies that genuinely drive suitability for this role.
   - **What You Shouldn't Overthink**: Reassurance on formatting trivia and redundant keywords to relieve anxiety.
   - **Realistic Opportunities**: Honest recommendations (never advising fabricated claims).
   - **What the Referee Doesn't Know**: Explicit disclosure of unobserved factors (live coding, interviews).

### Mode B — Head-to-Head Referee
**Pairwise comparative judgment.** When a competitor or friend's resume is available, it can be attached immediately or days later.
- Impartial verdict:
  - `Candidate A currently has the stronger evidence`
  - `Candidate B currently has the stronger evidence`
  - `Too close to call (Tie)` *(A legitimate, honest outcome when evidence is balanced)*
  - `Insufficient evidence to determine an edge`
- **What Actually Decided It**: 2 to 5 decisive differences that carry genuine weight for the specific role.
- **Requirement-by-Requirement Comparison Matrix**: Side-by-side assessment across every priority skill.
- **What Neither Candidate Should Overthink**: Prevents both candidates from obsessing over meaningless nuances.
- **What Could Change the Call**: Unknowns like unlisted internships or coding assessment results.

---

## 🔍 Impartial Referee Protocol

| Dimension | Referee Rule |
|---|---|
| **Evidence Types** | Every claim is classified as **`explicit`** (verifiable output), **`indirect`** (coursework/adjacent tools), or **`none`** (*"No evidence was found in the submitted resume"*). Never equates absence with lack of knowledge. |
| **No False Precision** | Avoids superficial decimals (e.g. 87.42% vs 86.91%). Uses calibrated qualitative states. |
| **Tie Support** | If candidates exhibit comparable evidence across critical requirements, the verdict is **Tie ("Too close to call")**. A tie is a feature of honest calibration. |
| **No Hiring Predictions** | Never says *"Candidate A has an 82% chance of getting hired"*. States: *"Candidate A currently has stronger evidence based on submitted materials."* |
| **Unobserved Factors** | Explicitly acknowledges that live coding assessments, system design under time pressure, and behavioral interviews have not been observed. |
| **Zero Resume Fraud** | Suggestions always state: *"Only add if you genuinely have this experience."* Never encourages fabricating skills. |

---

## 🏗️ System Architecture

```
                               ┌───────────────────────────────────┐
                               │     React 18 + Vite Frontend      │
                               │  Tailwind CSS 3 + Framer Motion   │
                               └─────────────────┬─────────────────┘
                                                 │ HTTP / REST (JWT Auth)
                                                 ▼
                               ┌───────────────────────────────────┐
                               │       Node.js / Express API       │
                               │        JavaScript ES Modules      │
                               └─────────┬───────────────┬─────────┘
                                         │               │
                        ┌────────────────┘               └────────────────┐
                        ▼                                                 ▼
         ┌──────────────────────────────┐                  ┌──────────────────────────────┐
         │    MongoDB Atlas Database    │                  │    Google Gemini Flash AI    │
         │   (User-Scoped Persistence)  │                  │  (Multi-Key Pool & Rotation) │
         ├──────────────────────────────┤                  ├──────────────────────────────┤
         │ • refereecases               │                  │ • buildSoloRefereePrompt     │
         │ • resumes (Candidate A / B)  │                  │ • buildHeadToHeadPrompt      │
         │ • users (JWT / Google OAuth) │                  │ • buildExtractionPrompt      │
         │ • jobs & legacy screenings   │                  │ • Safe partial JSON recovery │
         └──────────────────────────────┘                  └──────────────────────────────┘
```

---

## 💾 Case Lifecycle & Persistence

Referee cases transition cleanly through four states:
1. **`draft`**: Opportunity details entered; analysis pending.
2. **`solo_completed`**: Candidate A analyzed; Solo Assessment persisted in MongoDB.
3. **`comparing`**: Candidate B attached; comparative analysis in progress.
4. **`completed`**: Head-to-Head analysis finalized and persisted.

### Zero-Cost Refresh & Asynchronous Upgrade
- **Zero Redundant AI Calls**: Once a case is completed, viewing or refreshing `/referee/:id` performs a pure database read from MongoDB Atlas. Gemini is never called again on page reloads.
- **Return Days Later**: A student can generate their solo assessment on Day 1, log off, return on Day 3, click **"Add Candidate B"**, and upgrade the existing case into a Head-to-Head call without starting over.

---

## 📡 REST API Reference

### Placement Referee Endpoints

| Method | Endpoint | Description | Payload / Params |
|---|---|---|---|
| `POST` | `/api/referee/solo` | Create and analyze a new Solo Referee Case | Multipart: `resume` (file), `company`, `role`, `context`, `jobDescription` |
| `POST` | `/api/referee/:id/candidate-b` | Attach Candidate B and execute comparative analysis | Multipart: `resume` (file), Param: `id` |
| `GET` | `/api/referee` | List all referee cases belonging to the user | Returns array of user cases with verdicts and dates |
| `GET` | `/api/referee/:id` | Retrieve full cached case record (0 LLM cost) | Param: `id` |
| `DELETE` | `/api/referee/:id` | Delete a referee case record | Param: `id` |
| `POST` | `/api/referee/fetch-url` | Extract public text from a job posting URL | JSON: `{ url: string }` |

### Retained Legacy Endpoints
- `/api/v1/auth/register` & `/login`: Local JWT authentication
- `/api/v1/auth/google`: Google OAuth 2.0 verification
- `/api/resumes`: Bulk file upload and structured parsing
- `/api/jobs`: Job description persistence
- `/api/screen`: Bulk candidate scoring against a job description
- `/api/analyze`: Interactive single-resume keyword mapping and studio view

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local instance or free [MongoDB Atlas](https://www.mongodb.com/) cluster
- **Google Gemini API Key**: Free key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/hmm183/placement-referee.git
cd placement-referee
```

### 2. Configure Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```env
GEMINI_API_KEY=AIzaSy...your_gemini_key
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/placement_referee
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173
```

Start the backend server:
```bash
npm run dev
# Starts on http://localhost:5000
```

### 3. Configure Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Starts Vite dev server on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Production Deployment Guide

### Backend Deployment (Render)
1. In [Render](https://render.com/), create a new **Web Service** and connect your GitHub repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables in Render:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/placement_referee
   GEMINI_API_KEY=AIzaSy...your_gemini_key
   GEMINI_API_KEY_1=AIzaSy...your_backup_gemini_key
   JWT_SECRET=your_production_secret
   ALLOWED_ORIGINS=https://frontend-omega-inky-86.vercel.app
   UNSTRACT_API_KEY=your_unstract_api_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### Frontend Deployment (Vercel)
1. Import the repository in [Vercel](https://vercel.com/).
2. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variables in Vercel:
   ```env
   VITE_API_URL=https://placement-referee.onrender.com
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```
4. Click **Deploy**.

### Google OAuth Client Setup
In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **OAuth 2.0 Client IDs**:
- **Authorized JavaScript Origins**:
  - `http://localhost:5173`
  - `https://frontend-omega-inky-86.vercel.app`
- **Authorized Redirect URIs**:
  - `http://localhost:5173`
  - `https://frontend-omega-inky-86.vercel.app`
  - `https://placement-referee.onrender.com/api/v1/auth/google`

---

## ⏰ Keeping Backend Awake (Free Tier Cron)

Render free-tier web services sleep after 15 minutes of inactivity, causing a 30–50 second cold start on the next request.  
You can eliminate cold starts by setting up a free ping every **10–14 minutes** to your lightweight `/health` endpoint:

```
GET https://placement-referee.onrender.com/health
```

### Setup via [cron-job.org](https://cron-job.org/) (Free in 60 seconds):
1. Create a free account at [cron-job.org](https://cron-job.org/).
2. Click **Create Cronjob**.
3. Set URL to `https://placement-referee.onrender.com/health`.
4. Set Schedule to **Every 14 minutes**.
5. Save. Your backend will stay warm and respond instantly!

---

## 🛡️ Fairness & Ethical Framework

- **Zero Protected Characteristics**: The referee strictly evaluates technical and experience evidence relevant to stated role requirements. It never evaluates or infers race, gender, religion, caste, age, sexual orientation, disability, or socioeconomic background.
- **Neutrality by Design**: Candidate A and Candidate B are evaluated against identical rubrics. If candidate evidence is balanced, the system produces a Tie rather than creating artificial separation.
- **Anti-Hallucination Guardrails**: If company-specific internal screening criteria are unavailable, the referee explicitly states that the assessment is based purely on the provided role requirements.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
