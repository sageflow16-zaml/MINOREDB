import re

def extract_claims(text: str) -> list[str]:
    """
    Extracts atomic textual claims from normalized text using deterministic rules.
    
    Rules:
    - Deterministic split on sentence boundaries.
    - No AI, no paraphrasing, no merging.
    - Preserves original wording.
    """
    if not text:
        return []

    # Split on sentence boundaries (. ! ?) followed by whitespace or end of string
    # This regex handles basic sentence splitting while preserving the punctuation
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    claims = []
    for sentence in sentences:
        trimmed = sentence.strip()
        if trimmed:
            claims.append(trimmed)
            
    return claims
