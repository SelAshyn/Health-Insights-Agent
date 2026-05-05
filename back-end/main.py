"""
Health Insights Agent — FastAPI back-end.
All analysis and chat endpoints require a valid Firebase ID token.
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any

load_dotenv()

from services.pdf import extract_text_from_bytes, MAX_SIZE_MB
from services.auth import verify_firebase_token
from agents.analysis import analyze_report
from agents.chat import chat_with_report

app = FastAPI(title="Health Insights Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    analysis: dict[str, Any]
    analysis_raw: str
    model_used: str
    report_text: str
    page_count: int
    char_count: int

class TextAnalysisRequest(BaseModel):
    text: str
    filename: str = "Sample CBC Report"

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    question: str
    report_text: str
    analysis_raw: str
    history: list[ChatMessage] = []

class ChatResponse(BaseModel):
    answer: str
    model_used: str

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Public endpoint — no auth required."""
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_pdf(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(verify_firebase_token),
):
    """
    Analyze a PDF health report.
    Requires: Authorization: Bearer <Firebase ID token>
    """
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # ── Stream with byte cap ──────────────────────────────────────────────────
    # Read in chunks so we can reject oversized uploads before buffering them
    # fully into memory. A direct API caller could bypass the front-end 1.5 MB
    # limit and send arbitrarily large files otherwise.
    MAX_BYTES = int(MAX_SIZE_MB * 1024 * 1024)
    chunks: list[bytes] = []
    total = 0
    CHUNK = 64 * 1024  # 64 KB per read

    while True:
        chunk = await file.read(CHUNK)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum allowed size is {MAX_SIZE_MB} MB."
            )
        chunks.append(chunk)

    pdf_bytes = b"".join(chunks)
    # ─────────────────────────────────────────────────────────────────────────

    report_text = extract_text_from_bytes(pdf_bytes, filename=file.filename or "report.pdf")

    try:
        result = analyze_report(report_text)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Analysis parsing failed: {str(e)}")

    return AnalysisResponse(
        analysis=result["analysis"],
        analysis_raw=result["analysis_raw"],
        model_used=result["model_used"],
        report_text=report_text,
        page_count=report_text.count("--- Page"),
        char_count=len(report_text),
    )


@app.post("/analyze-text", response_model=AnalysisResponse)
async def analyze_text(
    request: TextAnalysisRequest,
    user: dict = Depends(verify_firebase_token),
):
    """
    Analyze raw text (used for sample reports and retries).
    Requires: Authorization: Bearer <Firebase ID token>
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        result = analyze_report(request.text)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Analysis parsing failed: {str(e)}")

    return AnalysisResponse(
        analysis=result["analysis"],
        analysis_raw=result["analysis_raw"],
        model_used=result["model_used"],
        report_text=request.text,
        page_count=1,
        char_count=len(request.text),
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: dict = Depends(verify_firebase_token),
):
    """
    Answer a follow-up question about the health report.
    Requires: Authorization: Bearer <Firebase ID token>
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if not request.report_text.strip():
        raise HTTPException(status_code=400, detail="No report context provided.")

    result = chat_with_report(
        question=request.question,
        report_text=request.report_text,
        analysis=request.analysis_raw,
        history=[{"role": m.role, "content": m.content} for m in request.history],
    )

    return ChatResponse(answer=result["answer"], model_used=result["model_used"])
