"""Evidence Validator — ensures every claim in the LLM answer is grounded in the evidence.

No LLM is used here. Simple fact-checking via string matching against
numbers, trade identifiers, pattern names, and metric values found in the context.
"""

import re


def _extract_numbers(text: str) -> set[str]:
    """Extract all decimal and integer numbers from text."""
    return set(re.findall(r"\d+\.?\d*", text))


def _extract_identifiers(text: str) -> set[str]:
    """Extract quoted identifiers, pattern names, and key phrases."""
    items: set[str] = set()
    items.update(re.findall(r"'([^']+)'", text))
    items.update(re.findall(r'"([^"]+)"', text))
    items.update(re.findall(r"\b([A-Z]{2,6})\b", text))  # EURUSD, BULLISH, WIN, etc.
    return items


def validate(answer: str, context: str) -> str:
    """Remove any unsubstantiated claims from the answer.

    Returns the cleaned answer. If all claims fail, returns a fallback message.
    """
    answer_lines = answer.strip().split("\n")
    valid_lines = []
    context_lower = context.lower()
    context_numbers = _extract_numbers(context)
    context_ids = _extract_identifiers(context)

    for line in answer_lines:
        stripped = line.strip()
        if not stripped:
            continue

        line_lower = stripped.lower()

        # Always keep structural / non-factual lines
        if line_lower.startswith(("based on", "note:", "there is insufficient", "from statistics", "knowledge", "pattern", "recent trade", "performance")):
            valid_lines.append(stripped)
            continue

        line_numbers = _extract_numbers(stripped)
        line_ids = _extract_identifiers(stripped)

        # If line has no numbers and no identifiers, it's an unsubstantiated claim
        if not line_numbers and not line_ids:
            continue

        # Check that numbers in this line exist in context
        if line_numbers and not line_numbers.issubset(context_numbers):
            continue

        # Check that identifiers are grounded
        if line_ids and not line_ids.issubset(context_ids):
            continue

        valid_lines.append(stripped)

    if not valid_lines:
        return "There is insufficient historical evidence."

    return "\n".join(valid_lines)
