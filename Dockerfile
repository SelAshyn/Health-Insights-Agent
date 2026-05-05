FROM python:3.12-slim

WORKDIR /app

# Install system dependencies needed by PyMuPDF
RUN apt-get update && apt-get install -y \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy back-end files
COPY back-end/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY back-end/ .

# Render sets $PORT dynamically
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
