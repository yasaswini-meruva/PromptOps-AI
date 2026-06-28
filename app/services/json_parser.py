import json
import re


def parse_json_reply(raw: str) -> dict:
    """
    Robust JSON parser for AI responses.
    Handles:
    - Raw JSON
    - Markdown code fences
    - Extra text before/after JSON
    """

    clean = raw.strip()

    # Try parsing directly
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        pass

    # Remove markdown fences
    fence_match = re.match(
        r"^```(?:json)?\s*(.*?)\s*```$",
        clean,
        re.DOTALL,
    )

    if fence_match:
        try:
            return json.loads(fence_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Extract first JSON object
    start = clean.find("{")
    end = clean.rfind("}")

    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(clean[start:end + 1])
        except json.JSONDecodeError:
            pass

    raise json.JSONDecodeError(
        "Could not extract valid JSON",
        clean,
        0,
    )