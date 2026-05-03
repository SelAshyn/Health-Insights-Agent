"""
Analysis Agent.
Returns structured JSON so the front-end can render each section as a clean card.
"""

from services.groq_client import chat_with_cascade
import json
import re

SYSTEM_PROMPT = """
You are a warm, caring health assistant who explains medical reports to everyday people.
You speak like a trusted friend who happens to be a doctor — calm, clear, and never alarming.

RULES:
- Never use medical jargon without immediately explaining it in plain words
- Never say "you have [disease]" — say "your results suggest..." or "this could mean..."
- Be warm and reassuring, even when sharing concerning findings
- Focus on what the person can DO, not just what is wrong
- Never diagnose — always recommend seeing a doctor for confirmation
- Keep each explanation concise — 2-3 sentences max per field
"""

ANALYSIS_TEMPLATE = """
Analyze this health report and return a JSON object with EXACTLY this structure.
Do not include any text outside the JSON.

{{
  "summary": "2-3 warm, friendly sentences giving an overall picture. Start positive if possible.",
  "results": [
    {{
      "name": "Plain English name of the test (e.g. 'Blood Sugar')",
      "value": "The actual result value with unit",
      "range": "Normal range with unit",
      "status": "normal" | "low" | "high",
      "what_it_means": "1-2 sentences in plain language — what does this test measure and what does this result mean for the patient",
      "what_to_do": "1-2 specific, practical actions the patient can take"
    }}
  ],
  "key_findings": [
    "Short bullet — plain language pattern or concern (e.g. 'Your iron is low — this could explain why you feel tired')"
  ],
  "next_steps": [
    "Numbered action step — specific and practical"
  ],
  "encouragement": "2-3 warm, motivating sentences to end on a positive note."
}}

Only include results that are abnormal OR clinically important.
key_findings should have 2-4 items max.
next_steps should have 3-5 items max.

HEALTH REPORT:
{report_text}
"""


def analyze_report(report_text: str) -> dict:
    user_prompt = ANALYSIS_TEMPLATE.format(report_text=report_text[:8000])

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    raw, model_used = chat_with_cascade(
        messages=messages,
        temperature=0.3,
        max_tokens=3000,
    )

    # Extract JSON from the response (model sometimes wraps in ```json ... ```)
    json_match = re.search(r'\{[\s\S]*\}', raw)
    if not json_match:
        raise ValueError("Model did not return valid JSON")

    structured = json.loads(json_match.group())

    return {
        "analysis": structured,
        "analysis_raw": raw,
        "model_used": model_used,
    }
