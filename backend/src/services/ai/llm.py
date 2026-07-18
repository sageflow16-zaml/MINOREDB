"""LLM provider abstraction — supports OpenAI, Claude, Gemini, and Ollama.

Selected via ANALYST_LLM_PROVIDER env var (default: openai).
Set ANALYST_LLM_API_KEY, ANALYST_LLM_MODEL, ANALYST_OLLAMA_BASE_URL as needed.
"""

import json
import os
import re
from typing import Protocol


class LLMProvider(Protocol):
    def generate(self, system_prompt: str, user_prompt: str) -> str: ...


class _OpenAIProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        import openai
        client = openai.OpenAI(
            api_key=os.getenv("ANALYST_LLM_API_KEY"),
        )
        model = os.getenv("ANALYST_LLM_MODEL", "gpt-4o-mini")
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
        )
        return resp.choices[0].message.content or ""


class _ClaudeProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        import anthropic
        client = anthropic.Anthropic(
            api_key=os.getenv("ANALYST_LLM_API_KEY"),
        )
        model = os.getenv("ANALYST_LLM_MODEL", "claude-3-haiku-20240307")
        resp = client.messages.create(
            model=model,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
            temperature=0.1,
        )
        return resp.content[0].text if resp.content else ""


class _GeminiProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=os.getenv("ANALYST_LLM_API_KEY"))
        model = genai.GenerativeModel(
            os.getenv("ANALYST_LLM_MODEL", "gemini-2.0-flash"),
            system_instruction=system_prompt,
        )
        resp = model.generate_content(user_prompt)
        return resp.text


class _OllamaProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        import httpx
        base = os.getenv("ANALYST_OLLAMA_BASE_URL", "http://localhost:11434")
        model = os.getenv("ANALYST_LLM_MODEL", "llama3.2")
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
            "options": {"temperature": 0.1},
        }
        resp = httpx.post(f"{base}/api/chat", json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "")


_PROVIDERS: dict[str, type] = {
    "openai": _OpenAIProvider,
    "claude": _ClaudeProvider,
    "gemini": _GeminiProvider,
    "ollama": _OllamaProvider,
}

SYSTEM_PROMPT = """You are an institutional-grade AI Research Analyst for a systematic trading operation.

YOUR RULES:
1. You are given EVIDENCE from these sources (ordered by priority):
   - PERSONAL TRADING INTELLIGENCE: trade debriefs, personal patterns, personal rules, trader profile — the user's own analyzed trading behavior.
   - The project's OWN historical trading data (trade memories, knowledge rules, statistics, patterns, graph, similarity, macro, learning).
   - The INSTITUTIONAL Knowledge Library (trading methodology concepts, definitions, rules, relationships, examples).
2. Answer the user's question using ONLY the provided evidence.
3. Always prioritize PERSONAL evidence over institutional knowledge. When the user's own data provides an answer, prefer that over generic methodology.
4. Clearly distinguish between evidence sources:
   - When citing personal intelligence, say: "Based on your trading profile..."
   - When citing historical data, say: "According to your historical trading data..."
   - When citing institutional knowledge, say: "According to institutional trading methodology..."
   - If evidence exists only in one source, explicitly state that.
5. NEVER invent facts, numbers, or trades that are not in the evidence.
6. If the evidence does not contain enough information to answer, say: "There is insufficient evidence."
7. You must NEVER recommend BUY or SELL. You can only explain past outcomes.
8. Every factual claim must be directly traceable to the evidence.
9. Be concise and precise — this is for professional traders.
10. Structure your answer in plain paragraphs. Do not use markdown formatting.

RESPONSE FORMAT:
Return a JSON object with these fields:
{
  "answer": "Your analysis text here",
  "confidence": 0-100 (how confident you are based on evidence quantity/quality),
  "sources": ["list", "of", "evidence", "sources", "used"]
}"""


def _clean_json(text: str) -> str:
    """Extract JSON from LLM response (handle markdown code fences)."""
    text = text.strip()
    # Remove markdown code fences
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = text.strip()
    if text.startswith("{"):
        return text
    # Try to find JSON object
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        return m.group()
    return text


def generate_answer(context: str) -> dict:
    """Send context to the configured LLM and return parsed response."""
    provider_name = os.getenv("ANALYST_LLM_PROVIDER", "openai").lower()
    provider_cls = _PROVIDERS.get(provider_name)
    if not provider_cls:
        # Fallback: return a deterministic answer if no LLM is configured
        return _fallback_answer(context)

    provider = provider_cls()
    try:
        raw = provider.generate(SYSTEM_PROMPT, context)
        cleaned = _clean_json(raw)
        result = json.loads(cleaned)
        return {
            "answer": result.get("answer", raw[:1000]),
            "confidence": min(100, max(0, int(result.get("confidence", 50)))),
            "sources": result.get("sources", []),
        }
    except Exception:
        return _fallback_answer(context)


def _fallback_answer(context: str) -> dict:
    """Deterministic fallback when no LLM is available."""
    lines = context.split("\n")
    has_debriefs = any("[PERSONAL TRADE DEBRIEFS]" in l for l in lines)
    has_personal_patterns = any("[PERSONAL PATTERNS]" in l for l in lines)
    has_personal_rules = any("[PERSONAL RULES]" in l for l in lines)
    has_profile = any("[TRADER PROFILE]" in l for l in lines)
    has_stats = any("[STATISTICS]" in l for l in lines)
    has_rules = any("[KNOWLEDGE RULES]" in l for l in lines)
    has_patterns = any("[PATTERNS]" in l for l in lines)
    has_memories = any("[TRADE MEMORIES]" in l for l in lines)
    has_graph = any("[KNOWLEDGE GRAPH]" in l for l in lines)
    has_similarity = any("[SIMILAR TRADES]" in l for l in lines)
    has_macro = any("[MACRO EVENTS]" in l for l in lines)
    has_institutional = any("[INSTITUTIONAL KNOWLEDGE]" in l for l in lines)

    sources = []
    answer_parts = []
    confidence = 30

    if has_debriefs:
        sources.append("Personal Trade Debriefs")
        for line in lines:
            if line.startswith("- Trade") and "Rating:" in line:
                answer_parts.append(f"From your debriefs: {line.strip()}")
                confidence += 15
                break
        for line in lines:
            if line.startswith("  Lesson:"):
                answer_parts.append(f"Lessons learned: {line.strip()}")
                confidence += 10
                break

    if has_profile:
        sources.append("Trader Profile")
        for line in lines:
            if line.startswith("Strengths:"):
                answer_parts.append(f"Your profile: {line.strip()}")
                confidence += 10
                break
        for line in lines:
            if "Discipline score:" in line:
                answer_parts.append(f"Discipline: {line.strip()}")
                confidence += 5
                break

    if has_personal_patterns:
        sources.append("Personal Patterns")
        for line in lines:
            if line.startswith("- ") and "occurrences" in line and "Personal" not in line:
                answer_parts.append(f"Personal pattern: {line.strip()}")
                confidence += 10
                break

    if has_personal_rules:
        sources.append("Personal Rules")
        for line in lines:
            if line.startswith("- ") and "[" in line and "v" in line:
                answer_parts.append(f"Personal rule: {line.strip()}")
                confidence += 10
                break

    if has_stats:
        sources.append("Statistics")
        for line in lines:
            if "Win rate" in line:
                answer_parts.append(f"From statistics: {line.strip()}")
                confidence += 15
                break
        for line in lines:
            if "Expectancy" in line or "Profit factor" in line:
                answer_parts.append(f"Performance metrics: {line.strip()}")
                confidence += 10
                break

    if has_rules:
        sources.append("Knowledge Rules")
        for line in lines:
            if line.startswith("- ") and "occurrences" in line:
                answer_parts.append(f"Knowledge rule: {line.strip()}")
                confidence += 10
                break

    if has_patterns:
        sources.append("Patterns")
        for line in lines:
            if line.startswith("- ") and "occurrences" in line:
                answer_parts.append(f"Pattern: {line.strip()}")
                confidence += 10
                break

    if has_memories:
        sources.append("Trade Memory")
        for line in lines:
            if line.startswith("- ") and "RR:" in line:
                answer_parts.append(f"Recent trade: {line.strip()}")
                confidence += 5
                break

    if has_graph:
        sources.append("Knowledge Graph")
        for line in lines:
            if "Nodes:" in line:
                answer_parts.append(f"Knowledge graph: {line.strip()}")
                confidence += 5
                break

    if has_similarity:
        sources.append("Similarity")
        confidence += 5

    if has_macro:
        sources.append("Macro")
        confidence += 5

    if has_institutional:
        sources.append("Institutional Knowledge")
        for line in lines:
            if line.startswith("- ") and "[" in line:
                answer_parts.append(f"Institutional methodology: {line.strip()}")
                confidence += 10
                break

    if not answer_parts:
        return {
            "answer": "There is insufficient historical evidence to answer this question.",
            "confidence": 0,
            "sources": [],
        }

    answer = "Based on the available evidence:\n\n" + "\n".join(answer_parts)
    if confidence < 50:
        answer += "\n\nNote: Limited evidence — conclusions may change with more data."

    return {
        "answer": answer,
        "confidence": min(100, confidence),
        "sources": list(dict.fromkeys(sources)),
    }
