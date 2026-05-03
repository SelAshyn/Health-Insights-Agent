"""
Groq client with multi-model cascade.
Tries models in order — if one fails or is rate-limited, falls back to the next.
"""

import os
from groq import Groq
from groq import RateLimitError, APIStatusError

# Model cascade: primary → secondary → tertiary → fallback
# These are all fast, capable models available on Groq's free tier
MODELS = [
    "llama-3.3-70b-versatile",   # primary — best quality
    "llama-3.1-8b-instant",      # secondary — faster, smaller
    "gemma2-9b-it",              # tertiary
    "mixtral-8x7b-32768",        # fallback
]

_client: Groq | None = None


def get_client() -> Groq:
    """Lazy-initialize the Groq client."""
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY not set in environment.")
        _client = Groq(api_key=api_key)
    return _client


def chat_with_cascade(
    messages: list[dict],
    temperature: float = 0.3,
    max_tokens: int = 2048,
) -> tuple[str, str]:
    """
    Send a chat request with automatic model fallback.
    Returns (response_text, model_used).
    Raises RuntimeError if all models fail.
    """
    client = get_client()
    last_error = None

    for model in MODELS:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content or ""
            return content, model

        except RateLimitError as e:
            # Rate limited on this model — try the next one
            last_error = e
            continue

        except APIStatusError as e:
            # Model unavailable or other API error — try next
            last_error = e
            continue

    raise RuntimeError(f"All Groq models failed. Last error: {last_error}")
