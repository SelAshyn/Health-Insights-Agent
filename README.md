# Health Insights Agent

An AI-powered health report analysis platform. Upload a PDF blood report, get a plain-language explanation of your results, and ask follow-up questions in a chat interface — no medical background required.

---

## Features

- **Plain-language analysis** — Every biomarker explained in simple, friendly terms with what it means and what you can do
- **Follow-up chat** — RAG-powered Q&A over your report using conversation history as context
- **Multi-model cascade** — Groq API with automatic fallback (llama-3.3-70b → llama-3.1-8b → gemma2-9b → mixtral)
- **Session history** — All sessions saved to Firestore; click any past session to reload its analysis and chat history
- **Sample report** — Try the app instantly with a built-in CBC report, no upload needed
- **Secure auth** — Firebase Authentication (email/password); all API endpoints require a valid ID token
- **PDF storage** — Reports stored in Supabase Storage, namespaced per user
- **Daily limit** — Configurable analysis cap (default 15/day) with countdown in the sidebar
- **Responsive UI** — Works on desktop and mobile; sidebar collapses to a hamburger menu on small screens

---

## Tech Stack

| Layer | Technology |
|---|---|
| Front-end | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Fonts | Sora (headings), Inter (body) via `next/font/google` |
| Auth | Firebase Authentication |
| Database | Firestore (session metadata, chat history) |
| File storage | Supabase Storage |
| Back-end | FastAPI (Python 3.12), Uvicorn |
| PDF extraction | PyMuPDF (fitz) |
| AI / LLM | Groq API |
| Auth middleware | firebase-admin (server-side token verification) |

---

## Project Structure

```
Health Insights Agent/
├── front-end/                  # Next.js app
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout (fonts, AuthProvider)
│   │   ├── auth/
│   │   │   ├── signin/page.tsx
│   │   │   └── signup/page.tsx
│   │   └── main/
│   │       ├── layout.tsx      # Sidebar + route protection
│   │       └── page.tsx        # Dashboard (upload, analysis, chat)
│   ├── components/landing/     # Landing page sections
│   ├── lib/
│   │   ├── firebase.ts         # Firebase app init
│   │   ├── AuthContext.tsx     # Auth state provider
│   │   └── supabase.ts         # Supabase client
│   └── types/
│       └── session.ts          # Session and analysis types
│
└── back-end/                   # FastAPI service
    ├── main.py                 # Routes (/analyze, /analyze-text, /chat)
    ├── agents/
    │   ├── analysis.py         # Analysis agent (structured JSON output)
    │   └── chat.py             # Chat agent (RAG with conversation history)
    └── services/
        ├── pdf.py              # PDF extraction with streaming size cap
        ├── groq_client.py      # Multi-model cascade
        └── auth.py             # Firebase token verification
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12
- A Firebase project (Auth + Firestore enabled)
- A Supabase project (Storage bucket named `reports`)
- A Groq API key ([console.groq.com](https://console.groq.com))

---

### Front-end setup

```bash
cd front-end
npm install
```

Create `front-end/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

---

### Back-end setup

```bash
cd back-end
py -3.12 -m venv venv
.\venv\Scripts\pip install -r requirements.txt   # Windows
# or: ./venv/bin/pip install -r requirements.txt  # macOS/Linux
```

Create `back-end/.env`:

```env
GROQ_API_KEY=...
FIREBASE_PROJECT_ID=...
DAILY_LIMIT=15
FRONTEND_URL=http://localhost:3000
```

```bash
.\venv\Scripts\uvicorn main:app --reload --port 8000
```

---

### Firebase setup

1. Enable **Email/Password** auth in Firebase Console → Authentication → Sign-in method
2. Create a **Firestore** database (production mode)
3. Add Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
      match /messages/{messageId} {
        allow read, write: if request.auth != null
          && request.auth.uid == get(/databases/$(database)/documents/sessions/$(sessionId)).data.userId;
      }
    }
  }
}
```

4. Create a composite Firestore index on `sessions`: `userId ASC, createdAt DESC`

---

### Supabase setup

1. Create a bucket named `reports` (private)
2. Run in SQL Editor:

```sql
DROP POLICY IF EXISTS "Allow all operations on reports" ON storage.objects;
CREATE POLICY "Allow all operations on reports"
ON storage.objects FOR ALL TO anon, authenticated
USING (bucket_id = 'reports')
WITH CHECK (bucket_id = 'reports');
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | Health check |
| `POST` | `/analyze` | Bearer token | Upload PDF, returns structured analysis |
| `POST` | `/analyze-text` | Bearer token | Analyze raw text (sample report / retry) |
| `POST` | `/chat` | Bearer token | Follow-up Q&A with report context |

All protected endpoints require `Authorization: Bearer <Firebase ID token>`.

---

## PDF Constraints

- Format: PDF only
- Max size: 1.5 MB
- Max pages: 50
- Text-based PDFs only — scanned image PDFs are not supported

---

## Environment Variables Reference

### Front-end (`front-end/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase project config (from Firebase Console → Project Settings) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | Back-end base URL (default: `http://localhost:8000`) |

### Back-end (`back-end/.env`)

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key |
| `FIREBASE_PROJECT_ID` | Firebase project ID (for token verification) |
| `DAILY_LIMIT` | Max analyses per user per day (default: 15) |
| `FRONTEND_URL` | Allowed CORS origin |
