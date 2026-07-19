"""Seed the database with realistic demo data for development & testing.

Usage:
    cd backend
    python seed.py [--drop]

Options:
    --drop    Drop all existing data before seeding
"""

import sys
import uuid
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import text as sql_text
from src.db.session import get_session_local, get_engine
from src.db.base import Base
from src.core.security import hash_password

# ── Helpers ──────────────────────────────────────────────────────────────────

FX_PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD", "USDCHF"]
DIRECTIONS = ["BUY", "SELL"]
BIASES = ["BULLISH", "BEARISH", "NEUTRAL"]
SESSIONS = ["ASIAN", "LONDON", "NEWYORK"]
MARKET_PHASES = ["ACCUMULATION", "MANIPULATION", "DISTRIBUTION", "MARKUP", "MARKDOWN"]
TRENDS = ["BULLISH", "BEARISH", "RANGING"]
LIQUIDITY_TYPES = ["BUY_SIDE", "SELL_SIDE", "BOTH"]
EMOTIONS = ["CALM", "CONFIDENT", "ANXIOUS", "GREEDY", "FEARFUL", "NEUTRAL"]
RESULTS = ["WIN", "LOSS", "BE"]
ENTRY_MODELS = ["LONDON_KILLZONE", "NEWYORK_KILLZONE", "ASIAN_KILLZONE", "FVG", "ORDER_BLOCK", "BREAKER"]
EXECUTION_MODELS = ["LIMIT", "MARKET", "STOP"]

QUICK_ACTIONS = [
    ("New Trade", "trades"),
    ("Journal Entry", "journal"),
    ("Add Source", "sources"),
    ("Run Analysis", "analyst"),
]

SOURCE_TEMPLATES = [
    {"origin_type": "article", "attribution": "Reuters", "raw_text": "The Federal Reserve left interest rates unchanged at 4.25%-4.50% during its latest meeting, signaling a cautious approach to monetary policy amid persistent inflation concerns."},
    {"origin_type": "article", "attribution": "Bloomberg", "raw_text": "EUR/USD rallied to a fresh monthly high above 1.0900 as the US dollar weakened following disappointing employment data."},
    {"origin_type": "analysis", "attribution": "DailyFX", "raw_text": "GBP/USD continues to respect the key support level at 1.2500, with bullish momentum building ahead of the BOE rate decision."},
    {"origin_type": "report", "attribution": "Bureau of Labor Statistics", "raw_text": "Non-farm payrolls increased by 275,000 in the latest month, exceeding expectations of 200,000, while the unemployment rate held steady at 3.9%."},
    {"origin_type": "article", "attribution": "Financial Times", "raw_text": "Gold prices surged past $2,400 per ounce as geopolitical tensions in the Middle East drove safe-haven demand."},
    {"origin_type": "analysis", "attribution": "TradingView", "raw_text": "USD/JPY broke above the 152.00 resistance level, reaching levels not seen since 1990, driven by widening interest rate differentials."},
]


def now(tz=timezone.utc):
    return datetime.now(tz)


def days_ago(n, tz=timezone.utc):
    return now(tz) - timedelta(days=n)


def random_price(base, spread_pct=0.02):
    return round(base * random.uniform(1 - spread_pct, 1 + spread_pct), 5)


# ── Main seeder ──────────────────────────────────────────────────────────────

def seed():
    engine = get_engine()
    SessionLocal = get_session_local()

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # ── 1. User ──────────────────────────────────────────────────────
        print("Creating user...")
        user_id = uuid.uuid4()
        db.execute(
            sql_text("""
                INSERT INTO "user" (id, email, hashed_password, name, is_active, created_at, updated_at)
                VALUES (:id, :email, :password, :name, :active, :now, :now)
                ON CONFLICT (email) DO NOTHING
            """),
            {
                "id": user_id,
                "email": "demo@minore.io",
                "password": hash_password("demo1234"),
                "name": "Demo Trader",
                "active": True,
                "now": now(),
            },
        )
        db.commit()

        # Fetch the actual user id (might already exist)
        row = db.execute(sql_text("SELECT id FROM \"user\" WHERE email = 'demo@minore.io'")).fetchone()
        user_id = row[0]

        # ── 2. Projects ─────────────────────────────────────────────────
        projects_data = [
            {
                "id": uuid.uuid4(),
                "name": "Forex Swing Trading",
                "description": "Daily and 4H swing trading strategy focusing on EURUSD, GBPUSD, and USDJPY. Uses ICT concepts with FVG and order block entries.",
                "status": "active",
            },
            {
                "id": uuid.uuid4(),
                "name": "Gold & Commodities",
                "description": "Intraday and swing trades on XAUUSD and oil. Combining macro analysis with price action.",
                "status": "active",
            },
            {
                "id": uuid.uuid4(),
                "name": "Scalping Lab",
                "description": "15-minute scalping strategy on major pairs. Testing killzone entries with tight risk management.",
                "status": "active",
            },
        ]

        for p in projects_data:
            db.execute(
                sql_text("""
                    INSERT INTO project (id, user_id, name, description, status, created_at, updated_at)
                    VALUES (:id, :uid, :name, :desc, :status, :now, :now)
                    ON CONFLICT (id) DO NOTHING
                """),
                {"id": p["id"], "uid": user_id, "name": p["name"], "desc": p["description"],
                 "status": p["status"], "now": now()},
            )
        db.commit()
        project_ids = [p["id"] for p in projects_data]
        print(f"  Created {len(project_ids)} projects")

        # ── 3. Sources ──────────────────────────────────────────────────
        print("Creating sources...")
        source_ids = {pid: [] for pid in project_ids}
        all_source_ids = []
        for pid in project_ids:
            for i, tpl in enumerate(SOURCE_TEMPLATES):
                sid = uuid.uuid4()
                all_source_ids.append(sid)
                source_ids[pid].append(sid)
                db.execute(
                    sql_text("""
                        INSERT INTO source (id, project_id, created_at, updated_at, origin_type, attribution, raw_text, normalized_text)
                        VALUES (:id, :pid, :now, :now, :otype, :attr, :raw, :raw)
                    """),
                    {"id": sid, "pid": pid, "now": days_ago(random.randint(1, 60)),
                     "otype": tpl["origin_type"], "attr": tpl["attribution"], "raw": tpl["raw_text"]},
                )
        db.commit()
        total_sources = sum(len(v) for v in source_ids.values())
        print(f"  Created {total_sources} sources")

        # ── 4. Claims ────────────────────────────────────────────────────
        print("Creating claims...")
        claim_texts = [
            "The Fed left interest rates unchanged at 4.25%-4.50%",
            "EUR/USD rallied to a fresh monthly high above 1.0900",
            "GBP/USD respects key support at 1.2500",
            "Non-farm payrolls increased by 275,000",
            "Unemployment rate held steady at 3.9%",
            "Gold prices surged past $2,400 per ounce",
            "USD/JPY broke above the 152.00 resistance",
            "Inflation remains persistent above target",
            "Consumer spending showed signs of slowing",
            "Manufacturing PMI contracted for third month",
            "Services sector expanded faster than expected",
            "BOE maintained interest rates at 5.25%",
            "ECB signaled potential rate cut in coming months",
            "Oil prices dropped amid demand concerns",
            "Risk sentiment improved following trade deal progress",
        ]
        claim_ids = {pid: [] for pid in project_ids}
        for pid in project_ids:
            srcs = source_ids[pid]
            for i, claim_text in enumerate(claim_texts):
                cid = uuid.uuid4()
                claim_ids[pid].append(cid)
                parent_src = random.choice(srcs)
                db.execute(
                    sql_text("""
                        INSERT INTO claim (id, project_id, created_at, updated_at, source_id, verbatim_text, semantic_classification)
                        VALUES (:id, :pid, :now, :now, :sid, :text, :class)
                    """),
                    {"id": cid, "pid": pid, "now": days_ago(random.randint(1, 60)),
                                     "sid": parent_src, "text": claim_text, "class": random.choice(["FACT", "OPINION", "FORECAST", "REPORT"])},
                )
        db.commit()
        total_claims = sum(len(v) for v in claim_ids.values())
        print(f"  Created {total_claims} claims")

        # ── 5. Concepts ──────────────────────────────────────────────────
        print("Creating concepts...")
        concept_terms = [
            "Interest Rates", "Inflation", "Employment", "GDP Growth",
            "Consumer Spending", "Manufacturing PMI", "Services PMI",
            "Central Bank Policy", "Geopolitical Risk", "Safe Haven",
            "Risk Sentiment", "Liquidity", "Market Structure", "Order Flow",
            "Supply and Demand", "Technical Analysis", "Fundamental Analysis",
            "Support Level", "Resistance Level", "Trend Following",
        ]
        concept_ids = {pid: [] for pid in project_ids}
        for pid in project_ids:
            for term in concept_terms:
                cid = uuid.uuid4()
                concept_ids[pid].append(cid)
                db.execute(
                    sql_text("""
                        INSERT INTO concept (id, created_at, updated_at, project_id, conceptual_term, definition)
                        VALUES (:id, :now, :now, :pid, :term, :defn)
                    """),
                    {"id": cid, "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "term": term, "defn": f"Concept representing {term.lower()} in market analysis context."},
                )
        db.commit()
        total_concepts = sum(len(v) for v in concept_ids.values())
        print(f"  Created {total_concepts} concepts")

        # ── 6. Associations ──────────────────────────────────────────────
        print("Creating associations...")
        for pid in project_ids:
            claims = claim_ids[pid]
            concepts = concept_ids[pid]
            for i in range(min(15, len(claims) * len(concepts))):
                db.execute(
                    sql_text("""
                        INSERT INTO association (id, created_at, updated_at, project_id, claim_id, concept_id, association_state)
                        VALUES (:id, :now, :now, :pid, :cid, :conid, :state)
                        ON CONFLICT DO NOTHING
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "cid": random.choice(claims), "conid": random.choice(concepts),
                     "state": random.choice(["SUPPORTED", "CHALLENGED", "NEUTRAL"])},
                )
        db.commit()
        print(f"  Created associations per project")

        # ── 7. Conflicts ─────────────────────────────────────────────────
        print("Creating conflicts...")
        conflict_ids = {pid: [] for pid in project_ids}
        for pid in project_ids:
            for i in range(3):
                cfid = uuid.uuid4()
                conflict_ids[pid].append(cfid)
                db.execute(
                    sql_text("""
                        INSERT INTO conflict (id, created_at, updated_at, project_id, conflict_classification, contextual_applicability_check)
                        VALUES (:id, :now, :now, :pid, :class, :check)
                    """),
                    {"id": cfid, "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "class": random.choice(["CONTRADICTION", "AMBIGUITY", "MISINTERPRETATION"]),
                     "check": "Applicable to current market conditions."},
                )
        db.commit()
        print(f"  Created conflicts per project")

        # ── 8. Interpretations ──────────────────────────────────────────
        print("Creating interpretations...")
        for pid in project_ids:
            concepts = concept_ids[pid]
            for i in range(6):
                db.execute(
                    sql_text("""
                        INSERT INTO interpretation (id, created_at, updated_at, project_id, concept_id, interpretation_statement, reasoning_chain)
                        VALUES (:id, :now, :now, :pid, :conid, :stmt, :reason)
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "conid": random.choice(concepts),
                     "stmt": f"Based on recent data, {random.choice(concept_terms).lower()} shows signs of {random.choice(['strengthening', 'weakening', 'stabilizing'])}.",
                     "reason": "Multi-timeframe analysis confirms the bias."},
                )
        db.commit()
        print(f"  Created interpretations per project")

        # ── 9. Research Questions & Hypotheses ───────────────────────────
        print("Creating research questions & hypotheses...")
        for pid in project_ids:
            cfs = conflict_ids[pid]
            for i in range(3):
                rqid = uuid.uuid4()
                cf = random.choice(cfs)
                db.execute(
                    sql_text("""
                        INSERT INTO research_question (id, created_at, updated_at, project_id, conflict_id, question_statement)
                        VALUES (:id, :now, :now, :pid, :cfid, :q)
                    """),
                    {"id": rqid, "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "cfid": cf,
                     "q": f"Does the recent {random.choice(['price action', 'economic data', 'market structure'])} support or refute the prevailing bias?"},
                )
                # Hypothesis for each question
                db.execute(
                    sql_text("""
                        INSERT INTO hypothesis (id, created_at, updated_at, project_id, research_question_id, hypothesis_statement)
                        VALUES (:id, :now, :now, :pid, :rqid, :h)
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "rqid": rqid,
                     "h": f"The market is likely to continue in the direction of the {random.choice(['higher timeframe', 'lower timeframe', 'prevailing'])} trend."},
                )
        db.commit()
        print(f"  Created research questions & hypotheses per project")

        # ── 10. Market Structures ─────────────────────────────────────────
        print("Creating market structures...")
        ms_ids = {pid: [] for pid in project_ids}
        for pid in project_ids:
            for i in range(5):
                msid = uuid.uuid4()
                ms_ids[pid].append(msid)
                pair = random.choice(FX_PAIRS)
                daily = random.choice(BIASES)
                db.execute(
                    sql_text("""
                        INSERT INTO market_structure
                        (id, created_at, updated_at, project_id, date, pair, timeframe,
                         weekly_bias, daily_bias, h4_bias, market_phase, trend,
                         premium_discount, external_liquidity, internal_liquidity,
                         bos, mss, order_block, fvg)
                        VALUES (:id, :now, :now, :pid, :date, :pair, :tf,
                                :wb, :db, :h4, :phase, :trend,
                                :pd, :ext_liq, :int_liq,
                                :bos, :mss, :ob, :fvg)
                    """),
                    {"id": msid, "now": days_ago(i * 7 + random.randint(1, 5)), "pid": pid,
                     "date": (now() - timedelta(days=i * 7)).date(),
                     "pair": pair, "tf": random.choice(["D1", "H4", "H1"]),
                     "wb": random.choice(BIASES), "db": daily,
                     "h4": random.choice(BIASES),
                     "phase": random.choice(MARKET_PHASES), "trend": random.choice(TRENDS),
                     "pd": random.choice(["PREMIUM", "DISCOUNT"]),
                     "ext_liq": f"{random_price(1.08)}-{random_price(1.10)}",
                     "int_liq": f"{random_price(1.06)}-{random_price(1.07)}",
                     "bos": "YES" if random.random() > 0.5 else "NO",
                     "mss": "YES" if random.random() > 0.5 else "NO",
                     "ob": f"{random_price(1.07)}-{random_price(1.08)}",
                     "fvg": f"{random_price(1.075)}-{random_price(1.085)}"},
                )
        db.commit()
        total_ms = sum(len(v) for v in ms_ids.values())
        print(f"  Created {total_ms} market structures")

        # ── 11. Trades ─────────────────────────────────────────────────
        print("Creating trades...")
        trade_ids = {pid: [] for pid in project_ids}
        for pid in project_ids:
            mss = ms_ids[pid]
            for i in range(20):
                tid = uuid.uuid4()
                trade_ids[pid].append(tid)
                pair = random.choice(FX_PAIRS)
                direction = random.choice(DIRECTIONS)
                entry = random_price(1.08)
                sl = entry - 0.0020 if direction == "BUY" else entry + 0.0020
                tp = entry + 0.0040 if direction == "BUY" else entry - 0.0040
                risk_pct = round(random.uniform(0.5, 2.0), 1)
                rr = round(random.uniform(0.5, 4.0), 2)
                result = random.choice(RESULTS + ["WIN", "WIN", "LOSS"])  # biased towards wins
                pnl_mult = {"WIN": rr * risk_pct, "LOSS": -risk_pct, "BE": 0}
                pnl = round(pnl_mult[result], 2)
                daily_b = random.choice(BIASES)
                h4_b = random.choice(BIASES)

                db.execute(
                    sql_text("""
                        INSERT INTO trade
                        (id, created_at, updated_at, project_id, market_structure_id,
                         pair, direction, entry_price, stop_loss, take_profit,
                         exit_price, position_size, risk_percent, rr, pnl, result, status,
                         weekly_bias, daily_bias, h4_bias,
                         liquidity_sweep, bos, mss, order_block, fvg,
                         asian_session, london_session, newyork_session,
                         dxy, us10y, us02y, emotion, notes)
                        VALUES (:id, :now, :now, :pid, :msid,
                                :pair, :dir, :entry, :sl, :tp,
                                :exit, :size, :risk, :rr, :pnl, :result, :status,
                                :wb, :db, :h4,
                                :ls, :bos, :mss, :ob, :fvg,
                                :asian, :london, :ny,
                                :dxy, :us10y, :us02y, :emotion, :notes)
                    """),
                    {"id": tid, "now": days_ago(random.randint(1, 90)), "pid": pid,
                     "msid": random.choice(mss) if random.random() > 0.3 else None,
                     "pair": pair, "dir": direction, "entry": entry,
                     "sl": sl, "tp": tp,
                     "exit": random_price(entry, 0.005) if result != "OPEN" else None,
                     "size": round(random.uniform(0.1, 2.0), 2),
                     "risk": risk_pct, "rr": rr, "pnl": pnl,
                     "result": result, "status": "CLOSED" if result != "OPEN" else "OPEN",
                     "wb": random.choice(BIASES), "db": daily_b, "h4": h4_b,
                     "ls": "YES" if random.random() > 0.5 else "NO",
                     "bos": "YES" if random.random() > 0.5 else "NO",
                     "mss": "YES" if random.random() > 0.5 else "NO",
                     "ob": "YES" if random.random() > 0.6 else "NO",
                     "fvg": "YES" if random.random() > 0.6 else "NO",
                     "asian": "YES" if random.random() > 0.5 else "NO",
                     "london": "YES" if random.random() > 0.5 else "NO",
                     "ny": "YES" if random.random() > 0.5 else "NO",
                     "dxy": str(round(random.uniform(103, 106), 2)),
                     "us10y": str(round(random.uniform(3.8, 4.5), 2)),
                     "us02y": str(round(random.uniform(4.2, 5.0), 2)),
                     "emotion": random.choice(EMOTIONS),
                     "notes": f"Trade #{i+1}: {pair} {direction}. Entry at {entry}. {'Good execution.' if result == 'WIN' else 'Needs review.'}"},
                )
        db.commit()
        total_trades = sum(len(v) for v in trade_ids.values())
        print(f"  Created {total_trades} trades")

        # ── 12. Knowledge Rules ─────────────────────────────────────────
        print("Creating knowledge rules...")
        rule_ids = {pid: [] for pid in project_ids}
        rule_data = [
            ("London Killzone Long", "Enter long during London open after displacement", "ENTRY"),
            ("FVG Retest", "Wait for fair value gap retest before entry", "ENTRY"),
            ("Breaker Block Reversal", "Breaker block on HTF indicates reversal", "ANALYSIS"),
            ("Asian Range Breakout", "Trade breakouts from Asian session range", "ENTRY"),
            ("MSS Confirmation", "Only enter after market structure shift confirmed", "FILTER"),
        ]
        for pid in project_ids:
            for title, desc, rtype in rule_data:
                rid = uuid.uuid4()
                rule_ids[pid].append(rid)
                occurrence = random.randint(5, 30)
                wins = random.randint(3, occurrence - 1)
                losses = occurrence - wins
                wr = round(wins / occurrence * 100, 1) if occurrence > 0 else 0
                avg_rr = round(random.uniform(1.2, 3.5), 2)
                db.execute(
                    sql_text("""
                        INSERT INTO knowledge_rule
                        (id, created_at, updated_at, project_id, title, description, category, rule_type,
                         confidence, occurrences, wins, losses, win_rate, avg_rr, expectancy, signature)
                        VALUES (:id, :now, :now, :pid, :title, :desc, :cat, :rtype,
                                :conf, :occ, :wins, :losses, :wr, :avgrr, :exp, :sig)
                    """),
                    {"id": rid, "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "title": title, "desc": desc, "cat": "ICT", "rtype": rtype,
                     "conf": round(random.uniform(0.5, 0.95), 2), "occ": occurrence,
                     "wins": wins, "losses": losses, "wr": wr,
                     "avgrr": avg_rr,
                     "exp": round((wr / 100 * avg_rr * 10) - ((100 - wr) / 100 * 10), 2),
                     "sig": f"{title.lower().replace(' ', '_')}_{pid.hex[:8]}"},
                )
        db.commit()
        total_rules = sum(len(v) for v in rule_ids.values())
        print(f"  Created {total_rules} knowledge rules")

        # ── 13. Trade Memories ──────────────────────────────────────────
        print("Creating trade memories...")
        for pid in project_ids:
            tids = trade_ids[pid]
            rids = rule_ids[pid]
            for tid in tids[:10]:
                rule = random.choice(rids) if rids else None
                db.execute(
                    sql_text("""
                        INSERT INTO trade_memory
                        (id, created_at, project_id, trade_id, knowledge_rule_id,
                         pair, direction, session, weekly_bias, daily_bias, h4_bias,
                         market_phase, market_trend, entry_model, execution_model,
                         risk_percent, rr, pnl, result,
                         strengths, weaknesses, mistakes, lessons, confidence)
                        VALUES (:id, :now, :pid, :tid, :rid,
                                :pair, :dir, :session, :wb, :db, :h4,
                                :phase, :trend, :entry_model, :exec_model,
                                :risk, :rr, :pnl, :result,
                                :strengths, :weaknesses, :mistakes, :lessons, :confidence)
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "tid": tid, "rid": rule,
                     "pair": random.choice(FX_PAIRS), "dir": random.choice(DIRECTIONS),
                     "session": random.choice(SESSIONS),
                     "wb": random.choice(BIASES), "db": random.choice(BIASES),
                     "h4": random.choice(BIASES),
                     "phase": random.choice(MARKET_PHASES), "trend": random.choice(TRENDS),
                     "entry_model": random.choice(ENTRY_MODELS),
                     "exec_model": random.choice(EXECUTION_MODELS),
                     "risk": round(random.uniform(0.5, 2.0), 1),
                     "rr": round(random.uniform(0.5, 4.0), 2),
                     "pnl": round(random.uniform(-200, 500), 2),
                     "result": random.choice(RESULTS),
                     "strengths": '["Good entry timing", "Proper stop placement"]',
                     "weaknesses": '["Exited too early"]',
                     "mistakes": '["FOMO entry on retracement"]' if random.random() > 0.5 else "[]",
                     "lessons": '["Wait for MSS confirmation before entry"]',
                     "confidence": round(random.uniform(0.3, 0.95), 2)},
                )
        db.commit()
        print(f"  Created trade memories per project")

        # ── 14. Patterns ─────────────────────────────────────────────────
        print("Creating patterns...")
        for pid in project_ids:
            tids = trade_ids[pid]
            pattern_names = [
                "London Open Displacement",
                "Asian Range Breakout",
                "NY Killzone Reversal",
                "FVG Bounce",
                "Order Block Sweep",
            ]
            for name in pattern_names:
                pat_id = uuid.uuid4()
                occ = random.randint(3, 15)
                wins = random.randint(1, occ - 1)
                losses = occ - wins
                wr = round(wins / occ * 100, 1) if occ > 0 else 0
                db.execute(
                    sql_text("""
                        INSERT INTO pattern
                        (id, created_at, updated_at, project_id, name, description, signature,
                         total_occurrences, wins, losses, breakevens, win_rate, average_rr, expectancy,
                         profit_factor, avg_win, avg_loss, confidence_score, first_seen, last_seen)
                        VALUES (:id, :now, :now, :pid, :name, :desc, :sig,
                                :occ, :wins, :losses, 0, :wr, :avgrr, :exp,
                                :pf, :aw, :al, :conf, :first, :last)
                    """),
                    {"id": pat_id, "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "name": name,
                     "desc": f"Pattern: {name.lower()} — identified from historical trades.",
                     "sig": '{"conditions": ["liquidity_sweep", "fvg"], "timeframe": "H1"}',
                     "occ": occ, "wins": wins, "losses": losses,
                     "wr": wr, "avgrr": round(random.uniform(1.5, 3.0), 2),
                     "exp": round(random.uniform(0.5, 2.0), 2),
                     "pf": round(random.uniform(1.2, 3.5), 2),
                     "aw": round(random.uniform(100, 400), 2),
                     "al": round(random.uniform(-200, -50), 2),
                     "conf": round(random.uniform(0.4, 0.9), 2),
                     "first": days_ago(random.randint(30, 90)),
                     "last": days_ago(random.randint(1, 10))},
                )
        db.commit()
        print(f"  Created patterns per project")

        # ── 15. Collectors ───────────────────────────────────────────────
        print("Creating collectors...")
        collector_names = ["news_feed", "economic_calendar", "market_data"]
        for pid in project_ids:
            for name in collector_names:
                db.execute(
                    sql_text("""
                        INSERT INTO collector_status
                        (id, project_id, name, status, enabled, last_run_at, next_run_at,
                         records_collected, errors, created_at, updated_at)
                        VALUES (:id, :pid, :name, :status, true, :last, :next,
                                :records, :errors, :now, :now)
                    """),
                    {"id": uuid.uuid4(), "pid": pid, "name": name,
                     "status": random.choice(["idle", "running", "idle"]),
                     "last": days_ago(random.randint(0, 2)),
                     "next": now() + timedelta(hours=random.randint(1, 6)),
                     "records": random.randint(50, 500),
                     "errors": random.randint(0, 5),
                     "now": now()},
                )
        db.commit()
        print(f"  Created collectors per project")

        # ── 16. Learning Events & Knowledge Snapshots ──────────────────
        print("Creating learning events & snapshots...")
        event_types = ["PATTERN_DISCOVERED", "RULE_GENERATED", "KNOWLEDGE_REBUILT",
                       "SIMILARITY_SCAN", "TRADE_ANALYZED", "DEBRIEF_CREATED"]
        for pid in project_ids:
            for i in range(5):
                db.execute(
                    sql_text("""
                        INSERT INTO learning_event
                        (id, created_at, project_id, event_type, entity_type, status, summary)
                        VALUES (:id, :now, :pid, :etype, :entity, :status, :summary)
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 30)),
                     "pid": pid, "etype": random.choice(event_types),
                     "entity": random.choice(["pattern", "rule", "trade", "memory"]),
                     "status": random.choice(["SUCCESS", "SUCCESS", "SUCCESS", "FAILED"]),
                     "summary": f"Completed {random.choice(['analysis', 'scan', 'generation', 'rebuild'])} successfully."},
                )
            # Knowledge snapshots
            for i in range(3):
                total_t = len(trade_ids[pid])
                db.execute(
                    sql_text("""
                        INSERT INTO knowledge_snapshot
                        (id, created_at, project_id, total_trades, total_patterns,
                         total_claims, total_concepts, total_sources,
                         total_similarities, total_interpretations,
                         win_rate, avg_rr, expectancy, knowledge_growth)
                        VALUES (:id, :now, :pid, :tt, :tp,
                                :tc, :tcon, :ts, :tsim, :tint,
                                :wr, :avgrr, :exp, :growth)
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(i * 10 + random.randint(1, 5)),
                     "pid": pid, "tt": total_t, "tp": len(pattern_names),
                     "tc": len(claim_ids[pid]), "tcon": len(concept_ids[pid]),
                     "ts": len(source_ids[pid]), "tsim": 0, "tint": 0,
                     "wr": round(random.uniform(40, 65), 1),
                     "avgrr": round(random.uniform(1.2, 2.5), 2),
                     "exp": round(random.uniform(0.5, 1.5), 2),
                     "growth": round(random.uniform(0.05, 0.25), 3)},
                )
        db.commit()
        print(f"  Created learning events & snapshots per project")

        # ── 17. Knowledge Graph ─────────────────────────────────────────
        print("Creating knowledge graph data...")
        node_types = ["CONCEPT", "CLAIM", "PATTERN", "RULE", "TRADE", "SOURCE"]
        for pid in project_ids:
            node_ids = []
            for i in range(15):
                nid = uuid.uuid4()
                node_ids.append(nid)
                db.execute(
                    sql_text("""
                        INSERT INTO knowledge_node
                        (id, created_at, project_id, type, name, category, weight, occurrences)
                        VALUES (:id, :now, :pid, :type, :name, :cat, :weight, :occ)
                    """),
                    {"id": nid, "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "type": random.choice(node_types),
                     "name": f"Node_{i+1}_{random.choice(FX_PAIRS)}",
                     "cat": random.choice(["ICT", "MACRO", "PATTERN", "RULE"]),
                     "weight": round(random.uniform(0.5, 1.0), 2),
                     "occ": random.randint(1, 10)},
                )
            # Edges
            for i in range(min(20, len(node_ids) * 2)):
                src = random.choice(node_ids)
                tgt = random.choice([n for n in node_ids if n != src])
                db.execute(
                    sql_text("""
                        INSERT INTO knowledge_edge
                        (id, created_at, project_id, source_node_id, target_node_id, relationship, strength, occurrences, confidence)
                        VALUES (:id, :now, :pid, :src, :tgt, :rel, :strength, :occ, :conf)
                        ON CONFLICT DO NOTHING
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 60)), "pid": pid,
                     "src": src, "tgt": tgt,
                     "rel": random.choice(["CORRELATED", "CAUSES", "SUPPORTS", "CONTRADICTS", "LEADS_TO"]),
                     "strength": round(random.uniform(0.3, 1.0), 2),
                     "occ": random.randint(1, 5), "conf": round(random.uniform(0.3, 0.95), 2)},
                )
            # Snapshot
            db.execute(
                sql_text("""
                    INSERT INTO knowledge_graph_snapshot
                    (id, created_at, project_id, total_nodes, total_edges, summary)
                    VALUES (:id, :now, :pid, :nodes, :edges, :summary)
                """),
                {"id": uuid.uuid4(), "now": now(), "pid": pid,
                 "nodes": len(node_ids), "edges": 20,
                 "summary": f"Knowledge graph snapshot with {len(node_ids)} nodes and 20 edges."},
            )
        db.commit()
        print(f"  Created knowledge graph data per project")

        # ── 18. Macro Data ──────────────────────────────────────────────
        print("Creating macro data...")
        macro_events = [
            ("Interest Rate Decision", "US", "USD", "central_bank", "high"),
            ("Non-Farm Payrolls", "US", "USD", "employment", "high"),
            ("CPI Data", "US", "USD", "inflation", "high"),
            ("GDP Growth Rate", "US", "USD", "economic_growth", "high"),
            ("Retail Sales", "US", "USD", "consumption", "medium"),
            ("Manufacturing PMI", "US", "USD", "manufacturing", "medium"),
            ("Services PMI", "US", "USD", "services", "medium"),
            ("Unemployment Claims", "US", "USD", "employment", "medium"),
            ("Consumer Confidence", "US", "USD", "sentiment", "low"),
            ("Industrial Production", "US", "USD", "production", "low"),
        ]
        for name, country, currency, cat, importance in macro_events:
            base = round(random.uniform(0.5, 5.0), 2)
            db.execute(
                sql_text("""
                    INSERT INTO macro_event
                    (id, provider, event_name, country, currency, category, importance,
                     actual, forecast, previous, unit, release_time, created_at)
                    VALUES (:id, :provider, :name, :country, :currency, :cat, :imp,
                            :actual, :forecast, :prev, :unit, :release, :now)
                """),
                {"id": uuid.uuid4(), "provider": "forex_factory",
                 "name": name, "country": country, "currency": currency,
                 "cat": cat, "imp": importance,
                 "actual": round(base + random.uniform(-0.3, 0.3), 2),
                 "forecast": base,
                 "prev": round(base - random.uniform(0, 0.5), 2),
                 "unit": random.choice(["%", "K", "B", "index"]),
                 "release": days_ago(random.randint(1, 14)), "now": now()},
            )
        # Market snapshot
        db.execute(
            sql_text("""
                INSERT INTO market_snapshot
                (id, timestamp, dxy, us02y, us10y, yield_curve, sp500, nasdaq, gold, oil, vix, created_at)
                VALUES (:id, :ts, :dxy, :us02y, :us10y, :yc, :sp500, :nasdaq, :gold, :oil, :vix, :now)
            """),
            {"id": uuid.uuid4(), "ts": now(), "now": now(),
             "dxy": round(random.uniform(103, 106), 2),
             "us02y": round(random.uniform(4.2, 5.0), 2),
             "us10y": round(random.uniform(3.8, 4.5), 2),
             "yc": round(random.uniform(-0.8, -0.3), 2),
             "sp500": round(random.uniform(4800, 5200), 2),
             "nasdaq": round(random.uniform(15000, 17000), 2),
             "gold": round(random.uniform(2300, 2500), 2),
             "oil": round(random.uniform(72, 85), 2),
             "vix": round(random.uniform(12, 20), 2)},
        )
        db.commit()
        print(f"  Created macro data")

        # ── 19. Trader Intelligence ──────────────────────────────────────
        print("Creating trader intelligence data...")
        for pid in project_ids:
            tids = trade_ids[pid]
            # Debriefs
            for tid in tids[:5]:
                db.execute(
                    sql_text("""
                        INSERT INTO trade_debrief
                        (id, created_at, updated_at, project_id, trade_id,
                         entry_review, execution_review, exit_review, psychology_review,
                         strengths, weaknesses, mistakes, improvements,
                         overall_rating, summary)
                        VALUES (:id, :now, :now, :pid, :tid,
                                :entry, :exec, :exit, :psych,
                                :strengths, :weaknesses, :mistakes, :improvements,
                                :rating, :summary)
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 30)),
                     "pid": pid, "tid": tid,
                     "entry": "Entry was well-timed based on FVG retest. Price reacted immediately.",
                     "exec": "Order executed at expected level with minimal slippage.",
                     "exit": random.choice(["Exited at TP as planned.", "Exited early due to fear.", "Hit SL, need to review placement."]),
                     "psych": random.choice(["Maintained composure throughout.", "Felt anxious during drawdown.", "Stuck to the plan."]),
                     "strengths": '["Good patience waiting for entry", "Proper position sizing"]',
                     "weaknesses": '["Exited too early before full move"]' if random.random() > 0.5 else "[]",
                     "mistakes": '["Moved stop too close"]' if random.random() > 0.5 else "[]",
                     "improvements": '["Let winners run longer", "Trust the analysis"]',
                     "rating": random.randint(3, 9),
                     "summary": f"Debrief for trade #{random.randint(1, 20)}. Overall a {'good' if random.random() > 0.5 else 'needs improvement'} trade."},
                )

            # Personal patterns
            for name in ["Premature Exit Pattern", "Overtrading After Loss", "Hesitation on Entry",
                         "Good Risk Management", "Perfect FVG Entry"]:
                db.execute(
                    sql_text("""
                        INSERT INTO personal_pattern
                        (id, created_at, updated_at, project_id, name, category, description,
                         occurrence_count, win_count, loss_count, total_pnl, avg_rr, confidence, active)
                        VALUES (:id, :now, :now, :pid, :name, :cat, :desc,
                                :occ, :wins, :losses, :pnl, :avgrr, :conf, true)
                        ON CONFLICT (project_id, name) DO NOTHING
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 60)),
                     "pid": pid, "name": name,
                     "cat": random.choice(["BEHAVIORAL", "TECHNICAL", "PSYCHOLOGICAL"]),
                     "desc": f"Personal pattern: {name.lower()} — identified through trade review.",
                     "occ": random.randint(3, 15), "wins": random.randint(1, 10),
                     "losses": random.randint(1, 8),
                     "pnl": round(random.uniform(-500, 1000), 2),
                     "avgrr": round(random.uniform(0.8, 3.0), 2),
                     "conf": round(random.uniform(0.4, 0.9), 2)},
                )

            # Personal rules
            rule_titles = [
                "Only trade during London and NY killzones",
                "Minimum 1:2 risk-reward ratio required",
                "No trading within 30 minutes of major news",
                "Must have MSS confirmation before entry",
                "Maximum 2% risk per trade",
                "Close all positions before weekend gap",
            ]
            for title in rule_titles[:4]:
                db.execute(
                    sql_text("""
                        INSERT INTO personal_rule
                        (id, created_at, updated_at, project_id, title, description, category, status, version)
                        VALUES (:id, :now, :now, :pid, :title, :desc, :cat, :status, :ver)
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 60)),
                     "pid": pid, "title": title,
                     "desc": f"Trading rule: {title.lower()}",
                     "cat": random.choice(["RISK", "ENTRY", "EXIT", "GENERAL"]),
                     "status": random.choice(["draft", "active", "active", "approved"]),
                     "ver": 1},
                )

            # Trader profile
            db.execute(
                sql_text("""
                    INSERT INTO trader_profile
                    (id, created_at, updated_at, project_id,
                     strengths, weaknesses, trading_habits, discipline_score,
                     total_trades_analyzed, total_debriefs, active_patterns, approved_rules)
                    VALUES (:id, :now, :now, :pid,
                            :strengths, :weaknesses, :habits, :discipline,
                            :tta, :td, :ap, :ar)
                    ON CONFLICT (project_id) DO NOTHING
                """),
                {"id": uuid.uuid4(), "now": now(), "pid": pid,
                 "strengths": '["Good at identifying FVG", "Patient for entries", "Follows risk management"]',
                 "weaknesses": '["Exits trades too early", "Can overtrade after losses"]',
                 "habits": '{"best_session": "London", "avg_trades_per_day": 3, "common_mistakes": ["early_exit"]}',
                 "discipline": round(random.uniform(5, 9), 1),
                 "tta": len(trade_ids[pid]),
                 "td": min(5, len(trade_ids[pid])),
                 "ap": random.randint(2, 5),
                 "ar": random.randint(1, 4)},
            )
        db.commit()
        print(f"  Created trader intelligence data per project")

        # ── 20. Research Sessions ─────────────────────────────────────────
        print("Creating research sessions...")
        for pid in project_ids:
            for i in range(2):
                rsid = uuid.uuid4()
                db.execute(
                    sql_text("""
                        INSERT INTO research_session
                        (id, created_at, project_id, question, status, started_at, completed_at, duration)
                        VALUES (:id, :now, :pid, :q, :status, :started, :completed, :duration)
                    """),
                    {"id": rsid, "now": days_ago(random.randint(1, 30)),
                     "pid": pid,
                     "q": f"Research Question {i+1}: Analyze the impact of {random.choice(['interest rates', 'employment data', 'inflation'])} on {random.choice(FX_PAIRS)}.",
                     "status": "completed",
                     "started": days_ago(random.randint(2, 15)),
                     "completed": days_ago(random.randint(1, 14)),
                     "duration": round(random.uniform(30, 300), 1)},
                )
                # Tasks
                for step in range(3):
                    db.execute(
                        sql_text("""
                            INSERT INTO research_task
                            (id, created_at, session_id, step, tool, description, status, evidence_count)
                            VALUES (:id, :now, :sid, :step, :tool, :desc, :status, :ev)
                        """),
                        {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 15)),
                         "sid": rsid, "step": step + 1,
                         "tool": random.choice(["web_search", "news_analysis", "data_retrieval"]),
                         "desc": f"Step {step+1}: {random.choice(['Gather data', 'Analyze sources', 'Synthesize findings'])}",
                         "status": "completed", "ev": random.randint(3, 10)},
                    )
                # Report
                db.execute(
                    sql_text("""
                        INSERT INTO research_report
                        (id, created_at, session_id, summary, findings, recommendations, confidence)
                        VALUES (:id, :now, :sid, :summary, :findings, :recs, :conf)
                    """),
                    {"id": uuid.uuid4(), "now": days_ago(random.randint(1, 14)),
                     "sid": rsid,
                     "summary": f"Research completed. Analysis suggests {random.choice(['bullish', 'bearish', 'neutral'])} outlook for {random.choice(FX_PAIRS)}.",
                     "findings": '["Finding 1: Correlation confirmed", "Finding 2: Divergence detected on H4"]',
                     "recs": '["Consider long bias on pullbacks", "Watch for FVG fills"]',
                     "conf": round(random.uniform(0.5, 0.9), 2)},
                )
        db.commit()
        print(f"  Created research data per project")

        # ── 21. Replay Data ─────────────────────────────────────────────
        print("Creating replay data...")
        for pid in project_ids:
            for i in range(2):
                rsid = uuid.uuid4()
                pair = random.choice(FX_PAIRS)
                tf = "H1"
                start = days_ago(random.randint(30, 90))
                end = start + timedelta(days=random.randint(5, 20))
                total_candles = random.randint(100, 300)
                db.execute(
                    sql_text("""
                        INSERT INTO replay_session
                        (id, created_at, project_id, pair, timeframe, start_date, "current_date", end_date,
                         current_candle, total_candles, status, notes)
                        VALUES (:id, :now, :pid, :pair, :tf, :start, :current, :end,
                                :cc, :total, :status, :notes)
                    """),
                    {"id": rsid, "now": days_ago(random.randint(1, 30)),
                     "pid": pid, "pair": pair, "tf": tf,
                     "start": start, "current": start + timedelta(hours=random.randint(24, 100)),
                     "end": end,
                     "cc": random.randint(10, total_candles - 10),
                     "total": total_candles,
                     "status": "active",
                     "notes": f"Replay session for {pair} ({tf}) — practicing {random.choice(['FVG entries', 'killzone trading', 'trend following'])}."},
                )
        db.commit()
        print(f"  Created replay data per project")

        # ── 22. MT5 / TradingView Seed ─────────────────────────────────
        print("Creating MT5 connection...")
        db.execute(
            sql_text("""
                INSERT INTO broker_connection
                (id, created_at, updated_at, broker, server, account, terminal_path, status, connected)
                VALUES (:id, :now, :now, :broker, :server, :account, :terminal, :status, :connected)
                ON CONFLICT DO NOTHING
            """),
            {"id": uuid.uuid4(), "now": now(), "broker": "IC Markets",
             "server": "ICMarkets-Demo", "account": "demo",
             "terminal": "C:/Program Files/MetaTrader 5/terminal64.exe",
             "status": "disconnected", "connected": False},
        )
        db.commit()
        print("  Created MT5 integration data")

        # ── Summary ──────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print("[OK] Database seeded successfully!")
        print("=" * 60)
        print(f"  User:     demo@minore.io / demo1234")
        print(f"  Projects: {len(project_ids)}")
        print(f"  Sources:  {total_sources}")
        print(f"  Claims:   {total_claims}")
        print(f"  Concepts: {total_concepts}")
        print(f"  Trades:   {total_trades}")
        print(f"  Rules:    {total_rules}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    drop = "--drop" in sys.argv
    if drop:
        print("Dropping all tables...")
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(sql_text("""
                DO $$ DECLARE
                    r RECORD;
                BEGIN
                    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
                    LOOP
                        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
                    END LOOP;
                END $$;
            """))
            conn.commit()
        print("Tables dropped.")
    seed()
