import os

from dotenv import load_dotenv
from fastapi import HTTPException
from groq import Groq

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")

groq_client = Groq(api_key=groq_api_key) if groq_api_key else None


def groq_chat(messages, temperature=0.3, max_tokens=800):
    """
    Generic Groq Chat Completion
    """

    if groq_client is None:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is missing."
        )

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    return response.choices[0].message.content.strip()


def run_prompt(prompt_text, max_tokens=500):
    """
    Execute a prompt using Groq.
    """

    try:
        return groq_chat(
            [{"role": "user", "content": prompt_text}],
            temperature=0.5,
            max_tokens=max_tokens,
        )
    except Exception as e:
        return f"Error: {str(e)}"


def score_output(test_input, output):
    """
    Uses Groq as an AI judge.
    """

    system_prompt = (
        "You are an impartial quality judge. "
        "Score the response from 0 to 100. "
        "Return ONLY the integer."
    )

    try:

        raw = groq_chat(
            [
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": f"TASK: {test_input}\n\nRESPONSE: {output}",
                },
            ],
            temperature=0,
            max_tokens=10,
        )

        digits = "".join(c for c in raw if c.isdigit())

        return min(int(digits), 100) if digits else 0

    except Exception:
        return 0