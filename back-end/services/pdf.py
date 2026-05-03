"""
PDF extraction service.
Uses PyMuPDF (fitz) to extract text from uploaded PDF files.
"""

import fitz  # PyMuPDF
from fastapi import HTTPException

MAX_PAGES = 50
MAX_SIZE_MB = 1.5
MAX_SIZE_BYTES = int(MAX_SIZE_MB * 1024 * 1024)  # 1,572,864 bytes


def extract_text_from_bytes(pdf_bytes: bytes, filename: str = "report.pdf") -> str:
    """
    Extract all text from a PDF given its raw bytes.
    Raises HTTPException if the file is invalid, too large, or image-only.
    """
    if len(pdf_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum allowed size is {MAX_SIZE_MB} MB. "
                   f"Your file is {len(pdf_bytes) / 1024 / 1024:.1f} MB. "
                   f"Try compressing the PDF or exporting just the relevant pages."
        )

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid PDF file. Please upload a valid PDF.")

    if doc.page_count > MAX_PAGES:
        raise HTTPException(
            status_code=400,
            detail=f"PDF is too long ({doc.page_count} pages). Maximum is {MAX_PAGES} pages. "
                   f"Try uploading just the relevant pages of your report."
        )

    if doc.page_count == 0:
        raise HTTPException(status_code=400, detail="PDF has no pages.")

    pages_text = []
    total_chars = 0

    for page_num in range(doc.page_count):
        page = doc[page_num]
        text = page.get_text()
        if text.strip():
            pages_text.append(f"--- Page {page_num + 1} ---\n{text.strip()}")
            total_chars += len(text)

    doc.close()

    full_text = "\n\n".join(pages_text)

    if not full_text.strip():
        raise HTTPException(
            status_code=422,  # 422 = Unprocessable — distinct from 400 so front-end can detect it
            detail="SCANNED_PDF: This PDF appears to be a scanned image and contains no readable text. "
                   "Please ask your doctor or lab for a digital (text-based) version of your report, "
                   "or try taking a photo and using an OCR app to convert it first."
        )

    return full_text
