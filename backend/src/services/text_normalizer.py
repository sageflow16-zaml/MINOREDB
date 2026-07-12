import re

def normalize_text(text: str) -> str:
    """
    Normalizes text according to Project Minore guidelines.
    """
    if not text:
        return ""

    # 1. Convert Windows line endings (
) to Unix (
)
    text = text.replace("
", "
")

    # 4. Replace tabs with spaces
    text = text.replace("	", " ")

    # 5. Collapse multiple spaces into a single space
    # Process line by line to preserve paragraph boundaries
    lines = text.split("
")
    processed_lines = []
    for line in lines:
        # 2. Remove trailing spaces
        line = line.rstrip()
        # 5. Collapse multiple spaces
        line = re.sub(r" +", " ", line)
        # 6. Trim leading whitespace (since trailing is handled by rstrip)
        line = line.lstrip()
        processed_lines.append(line)

    text = "
".join(processed_lines)

    # 3. Collapse more than two consecutive blank lines into one
    # (Keep up to two blank lines to preserve paragraph boundaries)
    text = re.sub(r"
{3,}", "

", text)

    # 6. Final trim of leading/trailing whitespace of the entire document
    return text.strip()
