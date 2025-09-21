Lexiclaire — AI-powered Contract & Document Intelligence

Lexiclaire helps you understand long, messy PDFs/DOCX/TXT in minutes. Upload a document and get a clean summary, obligations, clauses, risks, and a grounded AI chat—plus a visual PDF preview with highlights that line up with what the AI is talking about.

Why Lexiclaire

Cut review time: instant summaries + structured findings.

Reduce risk: auto-detected risk items with severity (Low/Medium/High).

Explainability: side-by-side PDF preview with highlight overlays.

Traceable: tags, size, type, actions, and saved history.

Core Features
1) AI Document Analysis

Upload PDF, DOCX, or TXT.

Get:

Summary (plain-language, concise).

Obligations (what you must do, with source clause).

Risks (with severity: low/medium/high + clause reference).

Clauses (standard/unusual/restrictive with descriptions).

Metadata: overall risk level pill, tags, document size, file type, page count.

2) PDF Preview with Highlights

Embedded pdf.js renderer.

Automatic highlight overlays for:

Obligations (green)

Risks (red)

Clauses (blue)

Highlights are positioned using a page-aware range mapping so you can see where each finding came from.

If a document type isn’t previewable (e.g., DOCX/TXT), you still get full AI analysis.

3) AI Chat (Grounded Q&A)

Ask natural questions (“What are the late fees?”, “Termination rights?”).

Answers are grounded in the current document text; if not found, the bot says it can’t find it (no hallucinated claims).

4) Clauses View

Filterable list of key clauses with status badges:

Standard (✔️ expected)

Unusual (⚠️ attention)

Restrictive (⛔ risk)

Each clause includes a human-readable description.

5) Risk Visualization

Prominent risk chip in the header (High/Medium/Low).

Risk list with pill badges and color cues (red/orange/yellow).

6) Document Index & History

Auto-save each analysis (title, upload date, status, risk level, tags, size, type).

“My Documents” view for quick retrieval and filtering (by tags/risk planned).

Designed to store per-user history (MongoDB schema already set).

7) Version Compare (A→B)

Upload two versions; get a change report:

Added / Removed / Modified sections with short excerpts.

Human-friendly impact notes so you know what changed and why it matters.

8) Accessibility & Preferences

Dark mode, contrast slider, font size slider.

Multi-language UI (English, हिन्दी, ਪੰਜਾਬੀ).

Clean, responsive design (desktop-first with sensible mobile behavior).

9) Authentication (MVP)

Email/password signup & login (JWT).

Ready to associate documents with user IDs.

How It Works (High Level)

Frontend (Vite + React)

Uploads the file → shows live progress → renders pdf.js preview.

Displays analysis (summary, obligations, risks, clauses).

Provides grounded AI chat against the analyzed text.

Saves compact “history” entries and shows them in My Documents.

Backend (Express)

Accepts uploads and forwards to AI service.

Returns a structured AnalysisReport.

Stores document metadata in MongoDB (title, date, risk level, tags, size, type).

Auth endpoints (register/login).

AI Service (FastAPI + LangChain + Gemini)

Extracts text from PDF (PyPDF2), DOCX (python-docx), or TXT.

Prompts Gemini to return strict JSON (summary, obligations, risks, clauses, tags).

Computes overall riskLevel, pageOffsets, and highlights.

Provides a grounded /chat endpoint.

/compare returns an A/B change report (heuristic diff on sections).

Tech Stack

Frontend: React (Vite), TypeScript, shadcn/ui, Tailwind, pdf.js

Backend: Node.js, Express, Mongoose, JWT

AI Service: FastAPI, LangChain, Google Gemini (1.5-flash / 1.5-pro fallback), PyPDF2, python-docx

Database: MongoDB (Atlas or local)

Dev Tooling: nodemon, concurrently

Data Model (high level)

Document (MongoDB)

title, uploadDate, status (analyzed|analyzing|failed),
riskLevel (high|medium|low|null), tags[], size, type (PDF/DOCX/TXT)

(Future) userId

AnalysisReport (AI response)

summary, obligations[], risks[], clauses[]

riskLevel, tags[], size, type, pages

analyzedText, pageOffsets[], highlights[]

API (selected)

POST /api/analyze → forwards to AI /analyze and returns AnalysisReport.

POST /api/chat → forwards to AI /chat (grounded Q&A).

GET /api/documents → list saved documents (for history).

POST /api/compare → returns A/B change report (added/removed/modified).

POST /api/auth/register / POST /api/auth/login → JWT auth.

AI service:

POST /analyze (PDF/DOCX/TXT)

POST /chat

POST /compare

Security & Privacy (MVP)

Documents are processed locally through your AI service; no third-party uploads other than Gemini API calls for text analysis.

JWT-based auth included (extend with refresh tokens, password reset, etc.).

Add rate-limits/CORS/domain allowlists for production.

Known Limitations / Notes

PDF highlights are approximate (page-level mapping); they convey “where to look” rather than exact character boxes.

Very large PDFs can be heavy on memory; the renderer uses scaling and a page-by-page strategy to help.

If Gemini quota is exhausted, the UI shows a friendly error; fallback model is attempted automatically.
