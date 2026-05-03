"""
Chat Agent.
RAG-powered follow-up Q&A over the user's health report.
The report text + prior analysis act as the retrieval context.
"""

from services.groq_client import chat_with_cascade

CHAT_SYSTEM_PROMPT = """
You are a warm, knowledgeable health assistant helping a patient understand their
health report through conversation.

You have been given:
1. The patient's health report text
2. The analysis that was already provided to them

Your job is to answer their follow-up questions clearly and kindly.

RULES:
- Answer only questions related to the report or general health
- Never diagnose — say "this could suggest..." or "it's worth asking your doctor about..."
- Keep answers short (3-5 sentences max) unless the question needs more detail
- Use plain language — no jargon without explanation
- Be warm and reassuring
- If asked something outside the report scope, gently redirect
- Never make up values that aren't in the report
"""

CHAT_CONTEXT_TEMPLATE = """
Here is the patient's health report:
---
{report_text}
---

Here is the analysis that was already explained to them:
---
{analysis}
---

Now answer their question based on this context.
"""


def chat_with_report(
    question: str,
    report_text: str,
    analysis: str,
    history: list[dict],
) -> dict:
    """
    Answer a follow-up question about the health report.

    Args:
        question: The user's current question
        report_text: The extracted PDF text (RAG context)
        analysis: The prior analysis shown to the user
        history: List of prior messages [{"role": "user"|"assistant", "content": "..."}]

    Returns:
        dict with answer text and model used
    """
    context = CHAT_CONTEXT_TEMPLATE.format(
        report_text=report_text[:6000],   # cap to leave room for history
        analysis=analysis[:2000],
    )

    # Build message list: system → context → history → new question
    messages = [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT},
        {"role": "user", "content": context},
        {"role": "assistant", "content": "I've reviewed your report and analysis. What would you like to know?"},
    ]

    # Add conversation history (last 10 messages to stay within token limits)
    for msg in history[-10:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Add the new question
    messages.append({"role": "user", "content": question})

    answer, model_used = chat_with_cascade(
        messages=messages,
        temperature=0.5,
        max_tokens=800,
    )

    return {
        "answer": answer,
        "model_used": model_used,
    }
