import re


def normalize_text(text: str) -> str:
    """
    Normalize text without changing its meaning.
    """

    if not text:
        return ""

    # Windows -> Unix line endings
    text = text.replace("\r\n", "\n")

    # Tabs -> spaces
    text = text.replace("\t", " ")

    # Remove trailing spaces
    lines = [line.rstrip() for line in text.split("\n")]

    # Collapse multiple spaces
    lines = [re.sub(r" {2,}", " ", line) for line in lines]

    text = "\n".join(lines)

    # Collapse 3+ blank lines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()