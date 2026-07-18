from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from src.models.trade_memory import TradeMemory
from src.models.knowledge_rule import KnowledgeRule
from src.schemas.knowledge_rule import KnowledgeRuleCreate, KnowledgeRuleUpdate
from src.crud import knowledge_rule as crud


def _build_signature(memory: TradeMemory) -> str:
    parts = []
    if memory.session and memory.session != "NONE":
        parts.append(f"SESSION:{memory.session}")
    if memory.weekly_bias:
        parts.append(f"WB:{memory.weekly_bias.upper()}")
    if memory.daily_bias:
        parts.append(f"DB:{memory.daily_bias.upper()}")
    if memory.h4_bias:
        parts.append(f"H4:{memory.h4_bias.upper()}")
    if memory.liquidity_type and memory.liquidity_type != "NONE":
        parts.append(f"LQ:{memory.liquidity_type.upper()}")
    if memory.entry_model and memory.entry_model != "DISCRETIONARY":
        parts.append(f"EM:{memory.entry_model}")
    if memory.market_phase:
        parts.append(f"MP:{memory.market_phase.upper().replace(' ','_')}")
    if memory.market_trend:
        parts.append(f"MT:{memory.market_trend.upper().replace(' ','_')}")
    return "|".join(sorted(parts)) if parts else "BASELINE"


def _derive_title(signature: str, memories: list[TradeMemory]) -> str:
    parts = signature.split("|")
    session = ""
    bias = ""
    lq = ""
    for p in parts:
        if p.startswith("SESSION:"):
            session = p.split(":")[1].replace("_", " ").title()
        elif p.startswith("WB:"):
            bias = p.split(":")[1].title()
        elif p.startswith("LQ:"):
            lq = p.split(":")[1].title()

    if session and bias:
        return f"{session} {bias}"
    if session:
        return f"{session} Setup"
    if bias:
        return f"{bias} Bias"
    return "General Pattern"


def _derive_category(signature: str) -> str:
    parts = signature.split("|")
    for p in parts:
        if p.startswith("SESSION:"):
            return "Session"
        if p.startswith("MP:"):
            return "Market Structure"
        if p.startswith("MT:"):
            return "Market Structure"
        if p.startswith("EM:"):
            return "Entry Model"
        if p.startswith("LQ:"):
            return "Liquidity"
    return "General"


def _derive_rule_type(signature: str) -> str:
    session_keywords = {"ASIAN", "LONDON", "NEWYORK"}
    parts = set(p.split(":")[0] for p in signature.split("|"))
    if "SESSION" in parts:
        return "session_pattern"
    if "MP" in parts or "MT" in parts:
        return "market_structure"
    if "EM" in parts:
        return "entry_model"
    if "LQ" in parts:
        return "liquidity_pattern"
    return "general"


def _build_description(
    rule_title: str, category: str, memories: list[TradeMemory]
) -> str:
    total = len(memories)
    wins = sum(1 for m in memories if m.result == "WIN")
    losses = sum(1 for m in memories if m.result == "LOSS")
    win_rate = (wins / total * 100) if total > 0 else 0
    avg_rr = sum(m.rr for m in memories if m.rr is not None) / total if total > 0 else 0
    expectancy = (wins / total * avg_rr - losses / total) if total > 0 else 0

    lines = [f"Rule: {rule_title}"]
    lines.append(f"Category: {category}")
    lines.append(f"Based on {total} historical trade{'s' if total != 1 else ''}.")
    lines.append(
        f"Win rate: {win_rate:.1f}% ({wins}W / {losses}L). "
        f"Avg R:R: {avg_rr:.2f}. "
        f"Expectancy: {expectancy:.2f}."
    )

    sessions = set(m.session for m in memories if m.session and m.session != "NONE")
    if sessions:
        lines.append(f"Sessions: {', '.join(s.replace('_',' & ').title() for s in sorted(sessions))}.")
    biases = set()
    for m in memories:
        if m.weekly_bias:
            biases.add(f"Weekly {m.weekly_bias.title()}")
        if m.daily_bias:
            biases.add(f"Daily {m.daily_bias.title()}")
    if biases:
        lines.append(f"Biases: {', '.join(sorted(biases))}.")
    directions = set(m.direction.upper() for m in memories if m.direction)
    if directions:
        lines.append(f"Directions: {', '.join(sorted(directions))}.")

    return "\n".join(lines)


def _compute_confidence(total: int, win_rate: float, avg_rr: float) -> float:
    base = min(total / 50.0, 1.0) * 40.0
    wr_score = win_rate * 0.4
    rr_score = min(avg_rr / 5.0, 1.0) * 20.0
    return round(min(100.0, base + wr_score + rr_score), 1)


def _percentile_label(value: float) -> str:
    if value >= 80:
        return "High"
    if value >= 50:
        return "Medium"
    return "Low"


def update_knowledge(project_id: UUID, db: Session) -> list[KnowledgeRule]:
    memories = db.scalars(
        select(TradeMemory)
        .where(TradeMemory.project_id == project_id)
        .order_by(TradeMemory.created_at.desc())
    ).all()

    if not memories:
        return []

    clusters: dict[str, list[TradeMemory]] = {}
    for m in memories:
        sig = _build_signature(m)
        clusters.setdefault(sig, []).append(m)

    updated_rules = []
    for sig, cluster in clusters.items():
        total = len(cluster)
        if total < 5:
            continue

        wins = sum(1 for m in cluster if m.result == "WIN")
        losses = sum(1 for m in cluster if m.result == "LOSS")
        win_rate_val = (wins / total) if total > 0 else 0.0
        avg_rr_val = (
            sum(m.rr for m in cluster if m.rr is not None) / total if total > 0 else 0.0
        )
        expectancy = (wins / total * avg_rr_val - losses / total) if total > 0 else 0.0

        title = _derive_title(sig, cluster)
        category = _derive_category(sig)
        rule_type = _derive_rule_type(sig)
        description = _build_description(title, category, cluster)
        confidence = _compute_confidence(total, win_rate_val, avg_rr_val)

        existing = crud.get_by_signature(db, project_id=project_id, signature=sig)
        if existing:
            update_data = KnowledgeRuleUpdate(
                title=title,
                description=description,
                category=category,
                rule_type=rule_type,
                confidence=confidence,
                occurrences=total,
                wins=wins,
                losses=losses,
                win_rate=win_rate_val,
                avg_rr=avg_rr_val,
                expectancy=expectancy,
            )
            rule = crud.update(db, db_obj=existing, obj_in=update_data)
        else:
            create_data = KnowledgeRuleCreate(
                project_id=project_id,
                title=title,
                description=description,
                category=category,
                rule_type=rule_type,
                confidence=confidence,
                occurrences=total,
                wins=wins,
                losses=losses,
                win_rate=win_rate_val,
                avg_rr=avg_rr_val,
                expectancy=expectancy,
                signature=sig,
            )
            rule = crud.create(db, obj_in=create_data)

        for mem in cluster:
            if mem.knowledge_rule_id != rule.id:
                mem.knowledge_rule_id = rule.id
        db.commit()
        updated_rules.append(rule)

    return updated_rules
