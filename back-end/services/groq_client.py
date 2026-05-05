"""
Groq client with multi-model cascade.
Tries models in order — if one fails or is rate-limited, falls back to the next.
"""

import os
import base64
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

# Vision-capable models (support image input)
VISION_MODELS = [
    "meta-llama/llama-4-scout-17b-16e-instruct",  # primary vision model
    "llama-3.2-90b-vision-preview",               # fallback vision
    "llama-3.2-11b-vision-preview",               # smaller fallback
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
            last_error = e
            continue

        except APIStatusError as e:
            last_error = e
            continue

    raise RuntimeError(f"All Groq models failed. Last error: {last_error}")


def extract_text_from_image_bytes(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """
    Use a Groq vision model to extract all text from an image.
    Returns the extracted text as a plain string.
    Raises RuntimeError if all vision models fail.
    """
    client = get_client()
    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{b64}"

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": data_url},
                },
                {
                    "type": "text",
                    "text": (
                        "This is a medical lab report or health report image. "
                        "Extract ALL text from this image exactly as it appears — "
                        "preserve numbers, units, reference ranges, test names, and values. "
                        "Output only the extracted text, no commentary."
                    ),
                },
            ],
        }
    ]

    last_error = None
    for model in VISION_MODELS:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.1,
                max_tokens=4096,
            )
            return response.choices[0].message.content or ""
        except RateLimitError as e:
            last_error = e
            continue
        except APIStatusError as e:
            last_error = e
            continue

    raise RuntimeError(f"All vision models failed. Last error: {last_error}")
