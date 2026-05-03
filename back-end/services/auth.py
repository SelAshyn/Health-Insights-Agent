"""
Firebase Auth middleware for FastAPI.
Verifies the Firebase ID token sent in the Authorization header.
"""

import os
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ── Initialize Firebase Admin SDK ─────────────────────────────────────────────
# The Admin SDK can be initialized with a service account JSON file (for production)
# or with Application Default Credentials (for local dev if you're logged into gcloud).
# For simplicity, we use the project ID from env — the SDK will fetch public keys
# from Google to verify tokens without needing a service account for token verification only.

_firebase_initialized = False

def _ensure_initialized():
    global _firebase_initialized
    if not _firebase_initialized and not firebase_admin._apps:
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        if not project_id:
            raise RuntimeError(
                "FIREBASE_PROJECT_ID not set. Add it to back-end/.env"
            )
        # Initialize with just the project ID — sufficient for token verification
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
