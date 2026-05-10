"""
Health Insights Agent — FastAPI back-end.
All analysis and chat endpoints require a valid Firebase ID token.
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Any

load_dotenv()

from services.pdf import extract_text_from_bytes, MAX_SIZE_MB
from services.auth import verify_firebase_token
from agents.analysis import analyze_report
from agents.chat import chat_with_report
from services.groq_client import extract_text_from_image_bytes

# Image upload limits
MAX_IMAGE_MB = 5
MAX_IMAGE_BYTES = int(MAX_IMAGE_MB * 1024 * 1024)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

app = FastAPI(title="Health Insights Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global error handler — ensures CORS headers survive 500s ─────────────────
# FastAPI's CORSMiddleware only adds headers to responses it processes.
# If an unhandled exception bubbles up before the middleware can wrap it,
# the browser sees a response with no CORS headers and blocks it.
# This handler catches everything and re-adds the wildcard header.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={"Access-Control-Allow-Origin": "*"},
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
    return {"status": "ok", "cors": "wildcard", "version": "2024-05-05-v2"}


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


@app.post("/analyze-image", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    user: dict = Depends(verify_firebase_token),
):
    """
    Extract text from an image using vision AI, then analyze it.
    Accepts JPEG, PNG, WebP. Max 5 MB.
    Requires: Authorization: Bearer <Firebase ID token>
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only image files are accepted (JPEG, PNG, WebP)."
        )

    # Read with byte cap
    chunks: list[bytes] = []
    total = 0
    CHUNK = 64 * 1024
    while True:
        chunk = await file.read(CHUNK)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_IMAGE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Image too large. Maximum allowed size is {MAX_IMAGE_MB} MB."
            )
        chunks.append(chunk)

    image_bytes = b"".join(chunks)

    # Extract text via vision model
    try:
        report_text = extract_text_from_image_bytes(image_bytes, mime_type=content_type)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"Image text extraction failed: {str(e)}")

    if not report_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from this image. Make sure the image is clear and contains readable text."
        )

    # Analyze the extracted text
    try:
        result = analyze_report(report_text)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Analysis parsing failed: {str(e)}")

    return AnalysisResponse(
        analysis=result["analysis"],
        analysis_raw=result["analysis_raw"],
        model_used=result["model_used"],
        report_text=report_text,
        page_count=1,
        char_count=len(report_text),
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
