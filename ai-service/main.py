# ai-service/main.py
import os
import io
from typing import List, Literal, Optional, Tuple, Union

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from pydantic import BaseModel, Field

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

import docx
from PyPDF2 import PdfReader
import difflib

# ---------- ENV ----------
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env")

PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-1.5-pro")
MAX_CHARS = int(os.getenv("MAX_INPUT_CHARS", "60000"))

# ---------- SCHEMA ----------
class Obligation(BaseModel):
    text: str
    clause: str

class Risk(BaseModel):
    text: str
    clause: str
    severity: Literal["low", "medium", "high"]

class Clause(BaseModel):
    name: str
    status: Literal["standard", "unusual", "restrictive"]
    description: str

class Highlight(BaseModel):
    kind: Literal["obligation", "risk", "clause"]
    clause: Optional[str] = None
    text: str = Field(description="Exact short snippet to search/highlight")
    rangeStart: int
    rangeEnd: int

class AnalysisReport(BaseModel):
    summary: str
    obligations: List[Obligation]
    risks: List[Risk]
    clauses: List[Clause]
    # extras for UI/history
    riskLevel: Literal["low", "medium", "high"]
    tags: List[str] = []
    size: str
    type: Literal["pdf", "docx", "txt"]
    pages: int
    analyzedText: str
    pageOffsets: List[int]
    highlights: List[Highlight] = []

class ChatMessage(BaseModel):
    type: Literal["user", "ai"]
    content: str

class ChatRequest(BaseModel):
    question: str
    history: List[ChatMessage] = []
    documentId: str
    analyzedText: str

# Version compare
class Change(BaseModel):
    type: Literal["added", "modified", "removed"]
    section: str
    description: str
    impact: str

class ComparisonReport(BaseModel):
    versionA: dict
    versionB: dict
    changes: List[Change]

# ---------- APP ----------
app = FastAPI(title="Lexiclaire AI Service")

# CORS (open for local development; tighten for prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- HELPERS ----------
def build_llm(model: str) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=model,
        temperature=0,
        google_api_key=GOOGLE_API_KEY,
        convert_system_message_to_human=True,
    )

def make_chain(model: str, parser: JsonOutputParser):
    prompt = ChatPromptTemplate.from_template(
        "You are an expert legal analyst. "
        "Return ONLY valid JSON that matches this schema: {format_instructions}\n\n"
        "DOCUMENT:\n{document_text}"
    ).partial(format_instructions=parser.get_format_instructions())
    return prompt | build_llm(model) | parser

def is_quota_error(e: Exception) -> bool:
    s = str(e).lower()
    return "resourceexhausted" in s or "quota" in s or "429" in s

def read_docx(b: bytes) -> str:
    try:
        d = docx.Document(io.BytesIO(b))
        return "\n".join(p.text for p in d.paragraphs)
    except Exception as e:
        raise HTTPException(400, f"Could not process DOCX: {e}")

def read_pdf_and_offsets(b: bytes) -> Tuple[str, List[int], int]:
    """
    Returns (full_text, page_offsets, page_count).
    page_offsets[i] = cumulative char index where page i starts in full_text.
    """
    try:
        r = PdfReader(io.BytesIO(b))
        offsets: List[int] = []
        chunks: List[str] = []
        total = 0
        for p in r.pages:
            offsets.append(total)
            t = p.extract_text() or ""
            chunks.append(t)
            total += len(t)
        return ("\n".join(chunks), offsets, len(r.pages))
    except Exception as e:
        raise HTTPException(400, f"Could not process PDF: {e}")

def classify_overall_risk(risks: List[Risk]) -> Literal["low", "medium", "high"]:
    if any(r.severity == "high" for r in risks):
        return "high"
    if any(r.severity == "medium" for r in risks):
        return "medium"
    return "low"

def build_highlights(
    text: str,
    obligations: List[Obligation],
    risks: List[Risk],
    clauses: List[Clause],
) -> List[Highlight]:
    """Naive snippet matching for highlights; resilient to capitalization."""
    hl: List[Highlight] = []

    def add(kind: str, snippet: str, clause: Optional[str]):
        if not snippet:
            return
        q = snippet.strip()[:160]
        i = text.lower().find(q.lower())
        if i >= 0:
            hl.append(
                Highlight(
                    kind=kind, clause=clause, text=q, rangeStart=i, rangeEnd=i + len(q)
                )
            )

    for o in obligations:
        add("obligation", o.text, o.clause)
    for r in risks:
        add("risk", r.text, r.clause)
    for c in clauses:
        add("clause", c.description or c.name, None)

    return hl

def split_sections(s: str) -> List[str]:
    # Modest heuristic: break by blank lines
    return [blk.strip() for blk in s.split("\n\n") if blk.strip()]

def diff_sections(a: str, b: str) -> List[Change]:
    a_secs = split_sections(a)
    b_secs = split_sections(b)

    sm = difflib.SequenceMatcher(a=a_secs, b=b_secs, autojunk=False)
    changes: List[Change] = []

    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        if tag == "delete":
            for idx in range(i1, i2):
                changes.append(Change(
                    type="removed",
                    section=f"Section {idx+1}",
                    description=(a_secs[idx][:180] + ("..." if len(a_secs[idx]) > 180 else "")),
                    impact="May remove obligations/rights present in earlier version."
                ))
        elif tag == "insert":
            for idx in range(j1, j2):
                changes.append(Change(
                    type="added",
                    section=f"Section {idx+1}",
                    description=(b_secs[idx][:180] + ("..." if len(b_secs[idx]) > 180 else "")),
                    impact="Introduces new terms/obligations that weren’t in the original."
                ))
        elif tag == "replace":
            a_join = " ".join(a_secs[i1:i2])[:200]
            b_join = " ".join(b_secs[j1:j2])[:200]
            changes.append(Change(
                type="modified",
                section=f"Sections {i1+1}-{i2}",
                description=f"Changed from: “{a_join}” → “{b_join}”.",
                impact="Terms altered; review closely to confirm risk/obligation changes."
            ))
    return changes[:100]

# ---------- ENDPOINTS ----------
@app.post("/analyze", response_model=AnalysisReport)
async def analyze(
    document: UploadFile = File(None, alias="document"),
    file: UploadFile = File(None),
):
    # Accept both "document" (frontend) and "file" (backend forwarder)
    up: UploadFile | None = document or file
    if not up:
        raise HTTPException(400, "No file uploaded.")
    raw = await up.read()
    name = (up.filename or "").lower()

    ftype: Literal["pdf", "docx", "txt"]
    page_offsets: List[int] = []
    pages = 1

    if name.endswith(".pdf"):
        text, page_offsets, pages = read_pdf_and_offsets(raw)
        ftype = "pdf"
    elif name.endswith(".docx"):
        text = read_docx(raw)
        ftype = "docx"
    elif name.endswith(".txt"):
        text = raw.decode("utf-8", "ignore")
        ftype = "txt"
    else:
        raise HTTPException(400, "Unsupported file. Upload PDF/DOCX/TXT.")

    text = (text or "").strip()
    if not text:
        raise HTTPException(400, "Could not extract any text from the document.")

    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]

    size_kb = f"{round(len(raw) / 1024)} KB"

    # Ask the LLM for lists + tags
    class _LLMOut(BaseModel):
        summary: str
        obligations: List[Obligation]
        risks: List[Risk]
        clauses: List[Clause]
        tags: List[str]

    parser = JsonOutputParser(pydantic_object=_LLMOut)
    try:
        chain = make_chain(PRIMARY_MODEL, parser)
        out: Union[_LLMOut, dict] = chain.invoke({"document_text": text})
        if isinstance(out, dict):
            out = _LLMOut(**out)
    except Exception as e:
        if is_quota_error(e):
            try:
                chain = make_chain(FALLBACK_MODEL, parser)
                out2: Union[_LLMOut, dict] = chain.invoke({"document_text": text})
                out = _LLMOut(**out2) if isinstance(out2, dict) else out2
            except Exception as e2:
                if is_quota_error(e2):
                    raise HTTPException(
                        429,
                        "Gemini API quota exceeded. Enable billing/increase quota, or try a different model/key.",
                    )
                raise HTTPException(500, "AI processing failed (fallback).")
        else:
            raise HTTPException(500, "AI processing failed.")

    overall = classify_overall_risk(out.risks)
    highlights = build_highlights(text, out.obligations, out.risks, out.clauses)

    return AnalysisReport(
        summary=out.summary,
        obligations=out.obligations,
        risks=out.risks,
        clauses=out.clauses,
        riskLevel=overall,
        tags=list(dict.fromkeys(out.tags))[:6],
        size=size_kb,
        type=ftype,
        pages=pages,
        analyzedText=text,
        pageOffsets=page_offsets,
        highlights=highlights,
    )

@app.post("/chat", response_model=ChatMessage)
def chat(req: ChatRequest) -> ChatMessage:
    system = (
        "You are a helpful legal assistant. Answer based ONLY on the provided document text. "
        "If the answer is not found in the text, say you cannot find it."
    )
    hist = req.history[-8:]
    turns = "\n".join(f"{m.type.upper()}: {m.content}" for m in hist)

    prompt = ChatPromptTemplate.from_template(
        "{system}\n\nDOCUMENT:\n{doc}\n\nHISTORY:\n{turns}\n\nQUESTION:\n{q}"
    ).partial(system=system)

    llm = build_llm(PRIMARY_MODEL)
    try:
        msg = (prompt | llm).invoke(
            {"doc": req.analyzedText[:MAX_CHARS], "turns": turns, "q": req.question}
        )
        return ChatMessage(type="ai", content=str(msg.content))
    except Exception as e:
        if is_quota_error(e):
            llm = build_llm(FALLBACK_MODEL)
            msg = (prompt | llm).invoke(
                {"doc": req.analyzedText[:MAX_CHARS], "turns": turns, "q": req.question}
            )
            return ChatMessage(type="ai", content=str(msg.content))
        raise HTTPException(500, "Chat failed.")

@app.post("/compare", response_model=ComparisonReport)
async def compare(
    fileA: UploadFile = File(...),
    fileB: UploadFile = File(...),
):
    rawA = await fileA.read()
    rawB = await fileB.read()
    nameA = (fileA.filename or "").lower()
    nameB = (fileB.filename or "").lower()

    def extract(name: str, raw: bytes) -> str:
        if name.endswith(".pdf"):
            text, _, _ = read_pdf_and_offsets(raw)
            return text
        if name.endswith(".docx"):
            return read_docx(raw)
        if name.endswith(".txt"):
            return raw.decode("utf-8", "ignore")
        raise HTTPException(400, f"Unsupported type for {name}. Use PDF/DOCX/TXT.")

    a_text = (extract(nameA, rawA) or "").strip()
    b_text = (extract(nameB, rawB) or "").strip()
    if not a_text and not b_text:
        raise HTTPException(400, "Could not extract text from either file.")

    a_text = a_text[:MAX_CHARS]
    b_text = b_text[:MAX_CHARS]

    changes = diff_sections(a_text, b_text)

    return ComparisonReport(
        versionA={"title": fileA.filename or "Version A", "content": a_text},
        versionB={"title": fileB.filename or "Version B", "content": b_text},
        changes=changes,
    )

@app.get("/")
def root():
    return {"status": "Lexiclaire AI Service is running"}
