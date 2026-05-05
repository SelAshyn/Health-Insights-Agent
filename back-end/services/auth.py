"""
Firebase Auth middleware for FastAPI.
Verifies the Firebase ID token sent in the Authorization header.

Credential priority:
  1. FIREBASE_SERVICE_ACCOUNT_JSON env var — JSON string of the service account key
     (recommended for Render: paste the entire JSON as a single env var)
  2. GOOGLE_APPLICATION_CREDENTIALS env var — path to a service account JSON file
     (works locally if you have the file on disk)
  3. Bare project-ID init — works ONLY on Google Cloud (has ADC available).
     Will fail on Render/Heroku/etc. with "default credentials not found".
"""

import os
import json
import firebase_admin
from firebase_admin import credentials as fb_creds, auth as firebase_auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# ── Initialize Firebase Admin SDK ─────────────────────────────────────────────
_firebase_initialized = False

def _ensure_initialized():
    global _firebase_initialized
    if _firebase_initialized or firebase_admin._apps:
        _firebase_initialized = True
        return

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    if not project_id:
        raise RuntimeError("FIREBASE_PROJECT_ID not set.")

    # Option 1: full service account JSON stored as an env var string
    sa_json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    if sa_json_str:
        sa_dict = json.loads(sa_json_str)
        cred = fb_creds.Certificate(sa_dict)
        firebase_admin.initialize_app(cred, options={"projectId": project_id})
        _firebase_initialized = True
        return

    # Option 2: path to a service account JSON file on disk
    sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    if sa_path and os.path.isfile(sa_path):
        cred = fb_creds.Certificate(sa_path)
        firebase_admin.initialize_app(cred, options={"projectId": project_id})
        _firebase_initialized = True
        return

    # Option 3: ADC (only works on Google Cloud — will fail on Render)
    firebase_admin.initialize_app(options={"projectId": project_id})
    _firebase_initialized = True


# ── Bearer token extractor ────────────────────────────────────────────────────
_bearer_scheme = HTTPBearer(auto_error=False)


def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Security(_bearer_scheme),
) -> dict:
    """
    FastAPI dependency that verifies a Firebase ID token.

    Usage:
        @app.post("/analyze")
        async def analyze(user: dict = Depends(verify_firebase_token), ...):
            uid = user["uid"]

    Raises HTTP 401 if the token is missing or invalid.
    Returns the decoded token dict (contains uid, email, etc.)
    """
    _ensure_initialized()

    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header. Please sign in first."
        )

    token = credentials.credentials

    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token. Please sign in again.")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
