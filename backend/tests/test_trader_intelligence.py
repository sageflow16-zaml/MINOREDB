"""Tests for the Personal Trading Intelligence Engine."""
from uuid import uuid4, UUID
from datetime import datetime, timezone
from src.schemas.trader_intelligence import (
    TradeDebriefCreate, TradeDebriefUpdate,
    PersonalPatternCreate, PersonalPatternUpdate,
    PersonalRuleCreate, PersonalRuleUpdate,
)
from src.crud import trader_intelligence as crud
from src.services.trader_intelligence import (
    generate_debrief_from_trade, detect_personal_patterns,
    generate_proposed_rules, build_or_update_profile,
)
from src.models.project import Project
from src.models.trade import Trade


API_PREFIX = "/api/v1"


def _make_project(db):
    p = Project(name=f"pte-test-{uuid4().hex[:8]}", description="PTE test project")
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def _make_trade(db, project_id, **kwargs):
    data = {
        "project_id": project_id,
        "pair": "EURUSD",
        "direction": "BUY",
        "result": "WIN",
        "entry_price": 1.1000,
        "exit_price": 1.1050,
        "rr": 2.0,
        "weekly_bias": "BULLISH",
    }
    data.update(kwargs)
    t = Trade(**data)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


class TestTradeDebriefCRUD:

    def test_create_debrief(self, db):
        proj = _make_project(db)
        trade = _make_trade(db, proj.id)
        d = crud.create_debrief(db, obj_in=TradeDebriefCreate(
            project_id=proj.id, trade_id=trade.id,
            entry_review="Good entry", overall_rating=7,
            strengths=["discipline"], weaknesses=["impatience"],
            mistakes=["entered too early"], improvements=["wait for confirmation"],
            lessons_learned=["be patient"],
        ))
        assert d.id
        assert d.entry_review == "Good entry"
        assert d.overall_rating == 7
        assert d.strengths == ["discipline"]

    def test_read_debrief(self, db):
        proj = _make_project(db)
        trade = _make_trade(db, proj.id)
        d = crud.create_debrief(db, obj_in=TradeDebriefCreate(project_id=proj.id, trade_id=trade.id))
        got = crud.get_debrief(db, d.id)
        assert got.id == d.id

    def test_get_debrief_by_trade(self, db):
        proj = _make_project(db)
        trade = _make_trade(db, proj.id)
        d = crud.create_debrief(db, obj_in=TradeDebriefCreate(project_id=proj.id, trade_id=trade.id))
        got = crud.get_debrief_by_trade(db, trade_id=trade.id, project_id=proj.id)
        assert got.id == d.id

    def test_get_debriefs(self, db):
        proj = _make_project(db)
        t1 = _make_trade(db, proj.id)
        t2 = _make_trade(db, proj.id)
        crud.create_debrief(db, obj_in=TradeDebriefCreate(project_id=proj.id, trade_id=t1.id))
        crud.create_debrief(db, obj_in=TradeDebriefCreate(project_id=proj.id, trade_id=t2.id))
        items = crud.get_debriefs(db, project_id=proj.id)
        assert len(items) >= 2

    def test_update_debrief(self, db):
        proj = _make_project(db)
        trade = _make_trade(db, proj.id)
        d = crud.create_debrief(db, obj_in=TradeDebriefCreate(project_id=proj.id, trade_id=trade.id, summary="Old"))
        updated = crud.update_debrief(db, db_obj=d, obj_in=TradeDebriefUpdate(summary="New summary"))
        assert updated.summary == "New summary"

    def test_delete_debrief(self, db):
        proj = _make_project(db)
        trade = _make_trade(db, proj.id)
        d = crud.create_debrief(db, obj_in=TradeDebriefCreate(project_id=proj.id, trade_id=trade.id))
        crud.remove_debrief(db, id=d.id)
        assert crud.get_debrief(db, d.id) is None

    def test_search_debriefs(self, db):
        proj = _make_project(db)
        trade = _make_trade(db, proj.id)
        crud.create_debrief(db, obj_in=TradeDebriefCreate(project_id=proj.id, trade_id=trade.id, summary="missed opportunity good"))
        results = crud.search_debriefs(db, project_id=proj.id, q="missed")
        assert len(results) >= 1

    def test_debrief_count(self, db):
        proj = _make_project(db)
        assert crud.get_debrief_count(db, proj.id) == 0
        trade = _make_trade(db, proj.id)
        crud.create_debrief(db, obj_in=TradeDebriefCreate(project_id=proj.id, trade_id=trade.id))
        assert crud.get_debrief_count(db, proj.id) >= 1


class TestPersonalPatternCRUD:

    def test_create_pattern(self, db):
        proj = _make_project(db)
        p = crud.create_pattern(db, obj_in=PersonalPatternCreate(
            project_id=proj.id, name="LONDON_WINS", category="session",
            occurrence_count=10, win_count=7, loss_count=3,
            confidence=70.0, active=True,
        ))
        assert p.id
        assert p.name == "LONDON_WINS"
        assert p.win_count == 7

    def test_get_patterns(self, db):
        proj = _make_project(db)
        crud.create_pattern(db, obj_in=PersonalPatternCreate(project_id=proj.id, name="P1", category="session"))
        crud.create_pattern(db, obj_in=PersonalPatternCreate(project_id=proj.id, name="P2", category="pair"))
        items = crud.get_patterns(db, project_id=proj.id)
        assert len(items) >= 2

    def test_filter_patterns_by_category(self, db):
        proj = _make_project(db)
        crud.create_pattern(db, obj_in=PersonalPatternCreate(project_id=proj.id, name="S1", category="session"))
        crud.create_pattern(db, obj_in=PersonalPatternCreate(project_id=proj.id, name="P1", category="pair"))
        items = crud.get_patterns(db, project_id=proj.id, category="session")
        assert all(p.category == "session" for p in items)

    def test_filter_patterns_by_active(self, db):
        proj = _make_project(db)
        crud.create_pattern(db, obj_in=PersonalPatternCreate(project_id=proj.id, name="A1", category="session", active=True))
        crud.create_pattern(db, obj_in=PersonalPatternCreate(project_id=proj.id, name="A2", category="session", active=False))
        items = crud.get_patterns(db, project_id=proj.id, active=True)
        assert all(p.active for p in items)

    def test_update_pattern(self, db):
        proj = _make_project(db)
        p = crud.create_pattern(db, obj_in=PersonalPatternCreate(project_id=proj.id, name="U1", category="session", confidence=50.0))
        updated = crud.update_pattern(db, db_obj=p, obj_in=PersonalPatternUpdate(confidence=80.0))
        assert updated.confidence == 80.0

    def test_delete_pattern(self, db):
        proj = _make_project(db)
        p = crud.create_pattern(db, obj_in=PersonalPatternCreate(project_id=proj.id, name="D1", category="session"))
        crud.remove_pattern(db, id=p.id)
        assert crud.get_pattern(db, p.id) is None

    def test_pattern_count(self, db):
        proj = _make_project(db)
        assert crud.get_pattern_count(db, proj.id) == 0
        crud.create_pattern(db, obj_in=PersonalPatternCreate(project_id=proj.id, name="C1", category="session"))
        assert crud.get_pattern_count(db, proj.id) >= 1


class TestPersonalRuleCRUD:

    def test_create_rule(self, db):
        proj = _make_project(db)
        r = crud.create_rule(db, obj_in=PersonalRuleCreate(
            project_id=proj.id, title="Always check weekly bias", category="discipline",
        ))
        assert r.id
        assert r.status == "draft"
        assert r.version == 1

    def test_get_rules(self, db):
        proj = _make_project(db)
        crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="R1", category="discipline"))
        crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="R2", category="risk"))
        items = crud.get_rules(db, project_id=proj.id)
        assert len(items) >= 2

    def test_filter_rules_by_status(self, db):
        proj = _make_project(db)
        crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="Draft", category="discipline"))
        items = crud.get_rules(db, project_id=proj.id, status="draft")
        assert all(r.status == "draft" for r in items)

    def test_update_rule(self, db):
        proj = _make_project(db)
        r = crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="Old title", category="discipline"))
        updated = crud.update_rule(db, db_obj=r, obj_in=PersonalRuleUpdate(title="New title"))
        assert updated.title == "New title"

    def test_delete_rule(self, db):
        proj = _make_project(db)
        r = crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="Delete me", category="discipline"))
        crud.remove_rule(db, id=r.id)
        assert crud.get_rule(db, r.id) is None

    def test_approve_rule_workflow(self, db):
        proj = _make_project(db)
        r = crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="Approve me", category="discipline"))
        r.status = "approved"
        r.approved_at = datetime.now(timezone.utc)
        r.version += 1
        db.commit()
        db.refresh(r)
        assert r.status == "approved"
        assert r.version == 2

    def test_reject_rule_workflow(self, db):
        proj = _make_project(db)
        r = crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="Reject me", category="discipline"))
        r.status = "rejected"
        r.rejected_at = datetime.now(timezone.utc)
        r.rejection_reason = "Not applicable"
        db.commit()
        db.refresh(r)
        assert r.status == "rejected"

    def test_rule_versions(self, db):
        proj = _make_project(db)
        r = crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="V1", category="discipline"))
        v = crud.create_rule_version(db, rule_id=r.id, version=1, title="V1", change_notes="Initial")
        assert v.id
        versions = crud.get_rule_versions(db, r.id)
        assert len(versions) >= 1

    def test_rules_for_approval(self, db):
        proj = _make_project(db)
        crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="Needs review", category="discipline"))
        items = crud.get_rules_for_approval(db, proj.id)
        assert all(r.status == "draft" for r in items)

    def test_rule_count(self, db):
        proj = _make_project(db)
        assert crud.get_rule_count(db, proj.id) == 0
        crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="C1", category="discipline"))
        assert crud.get_rule_count(db, proj.id) >= 1

    def test_rule_count_by_status(self, db):
        proj = _make_project(db)
        crud.create_rule(db, obj_in=PersonalRuleCreate(project_id=proj.id, title="D1", category="discipline"))
        assert crud.get_rule_count(db, proj.id, status="draft") >= 1
        assert crud.get_rule_count(db, proj.id, status="approved") == 0


class TestTraderProfileCRUD:

    def test_get_or_create_profile(self, db):
        proj = _make_project(db)
        p = crud.get_or_create_profile(db, proj.id)
        assert p.id
        assert p.project_id == proj.id
        assert p.total_trades_analyzed == 0

    def test_get_profile(self, db):
        proj = _make_project(db)
        crud.get_or_create_profile(db, proj.id)
        p = crud.get_profile(db, proj.id)
        assert p is not None

    def test_update_profile(self, db):
        proj = _make_project(db)
        p = crud.get_or_create_profile(db, proj.id)
        crud.update_profile(db, db_obj=p, discipline_score=75.0, total_debriefs=5)
        assert p.discipline_score == 75.0
        assert p.total_debriefs == 5

    def test_create_snapshot(self, db):
        proj = _make_project(db)
        s = crud.create_snapshot(db, project_id=proj.id, snapshot_date=datetime.now(timezone.utc),
                                 discipline_score=60.0, total_trades_analyzed=3,
                                 total_debriefs=2, active_patterns=1, approved_rules=1)
        assert s.id
        assert s.discipline_score == 60.0

    def test_get_snapshots(self, db):
        proj = _make_project(db)
        crud.create_snapshot(db, project_id=proj.id, snapshot_date=datetime.now(timezone.utc),
                             total_trades_analyzed=1, total_debriefs=0,
                             active_patterns=0, approved_rules=0)
        crud.create_snapshot(db, project_id=proj.id, snapshot_date=datetime.now(timezone.utc),
                             total_trades_analyzed=2, total_debriefs=0,
                             active_patterns=0, approved_rules=0)
        snaps = crud.get_snapshots(db, proj.id)
        assert len(snaps) >= 2

    def test_profile_summary(self, db):
        proj = _make_project(db)
        crud.get_or_create_profile(db, proj.id)
        summary = crud.get_profile_summary(db, proj.id)
        assert summary["profile"] is not None
        assert summary["debrief_count"] == 0
        assert summary["pattern_count"] == 0


class TestGenerateDebrief:

    def test_generate_debrief_creates_debrief(self, db, client):
        resp = client.post(f"{API_PREFIX}/projects/", json={"name": f"pte-{uuid4().hex[:8]}", "description": "test"})
        assert resp.status_code == 200, f"Project create failed: {resp.text}"
        project = resp.json()
        pid = UUID(project["id"])

        resp2 = client.post(f"{API_PREFIX}/projects/{pid}/trades/", json={
            "pair": "EURUSD", "direction": "BUY", "result": "WIN",
            "entry_price": 1.1000, "exit_price": 1.1050,
            "stop_loss": 1.0980, "take_profit": 1.1060,
            "position_size": 10000, "risk_percent": 1.0,
            "rr": 2.5, "pnl": 50.0,
            "weekly_bias": "BULLISH", "daily_bias": "BULLISH",
            "mss": "YES", "bos": "YES", "order_block": "YES",
        })
        assert resp2.status_code in (200, 201), f"Trade create failed: {resp2.text}"
        trade = resp2.json()

        resp3 = client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/debriefs/generate", json={
            "trade_id": trade["id"],
        })
        assert resp3.status_code == 200, f"Debrief generate failed: {resp3.text}"
        data = resp3.json()
        assert data["debrief"]["trade_id"] == trade["id"]
        assert data["debrief"]["strengths"] is not None

    def test_generate_debrief_invalid_trade(self, db, client):
        resp = client.post(f"{API_PREFIX}/projects/", json={"name": f"pte-{uuid4().hex[:8]}", "description": "test"})
        assert resp.status_code == 200
        project = resp.json()
        pid = UUID(project["id"])

        resp = client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/debriefs/generate", json={
            "trade_id": str(uuid4()),
        })
        assert resp.status_code == 404


class TestPatternDetection:

    def test_detect_patterns_via_api(self, db, client):
        resp = client.post(f"{API_PREFIX}/projects/", json={"name": f"pte-{uuid4().hex[:8]}", "description": "test"})
        assert resp.status_code == 200
        project = resp.json()
        pid = UUID(project["id"])

        for i in range(4):
            client.post(f"{API_PREFIX}/projects/{pid}/trades/", json={
                "pair": "EURUSD", "direction": "BUY", "result": "WIN" if i < 3 else "LOSS",
                "entry_price": 1.10, "exit_price": 1.105, "rr": 2.0,
                "weekly_bias": "BULLISH",
            })

        resp = client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/patterns/detect?limit=50")
        assert resp.status_code == 200
        patterns = resp.json()
        assert len(patterns) >= 1


class TestRuleGeneration:

    def test_generate_rules(self, db, client):
        resp = client.post(f"{API_PREFIX}/projects/", json={"name": f"pte-{uuid4().hex[:8]}", "description": "test"})
        assert resp.status_code == 200
        project = resp.json()
        pid = UUID(project["id"])

        for i in range(6):
            client.post(f"{API_PREFIX}/projects/{pid}/trades/", json={
                "pair": "EURUSD", "direction": "BUY", "result": "WIN" if i < 5 else "LOSS",
                "entry_price": 1.10, "exit_price": 1.105, "rr": 2.0,
                "weekly_bias": "BULLISH", "mss": "YES",
            })

        client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/patterns/detect?limit=50")
        resp = client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/rules/generate")
        assert resp.status_code == 200
        data = resp.json()
        assert "rules" in data
        assert len(data["rules"]) >= 1

    def test_approve_rule_flow(self, db, client):
        resp = client.post(f"{API_PREFIX}/projects/", json={"name": f"pte-{uuid4().hex[:8]}", "description": "test"})
        assert resp.status_code == 200
        project = resp.json()
        pid = UUID(project["id"])

        for i in range(4):
            client.post(f"{API_PREFIX}/projects/{pid}/trades/", json={
                "pair": "EURUSD", "direction": "BUY", "result": "WIN",
                "entry_price": 1.10, "exit_price": 1.105, "rr": 2.0,
                "weekly_bias": "BULLISH", "mss": "YES",
            })

        client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/patterns/detect?limit=50")
        gen = client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/rules/generate").json()
        rule_id = gen["rules"][0]["id"]

        resp = client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/rules/{rule_id}/approve", json={})
        assert resp.status_code == 200
        assert resp.json()["status"] == "approved"

        resp2 = client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/rules/{rule_id}/approve", json={})
        assert resp2.status_code == 400

    def test_reject_rule_flow(self, db, client):
        resp = client.post(f"{API_PREFIX}/projects/", json={"name": f"pte-{uuid4().hex[:8]}", "description": "test"})
        assert resp.status_code == 200
        project = resp.json()
        pid = UUID(project["id"])

        for i in range(4):
            client.post(f"{API_PREFIX}/projects/{pid}/trades/", json={
                "pair": "EURUSD", "direction": "BUY", "result": "WIN",
                "entry_price": 1.10, "exit_price": 1.105, "rr": 2.0,
                "weekly_bias": "BULLISH", "mss": "YES",
            })

        client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/patterns/detect?limit=50")
        gen = client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/rules/generate").json()
        rule_id = gen["rules"][0]["id"]

        resp = client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/rules/{rule_id}/reject", json={"reason": "Not useful"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"
        assert resp.json()["rejection_reason"] == "Not useful"


class TestProfileBuilding:

    def test_build_profile(self, db, client):
        resp = client.post(f"{API_PREFIX}/projects/", json={"name": f"pte-{uuid4().hex[:8]}", "description": "test"})
        assert resp.status_code == 200
        project = resp.json()
        pid = UUID(project["id"])

        for i in range(2):
            client.post(f"{API_PREFIX}/projects/{pid}/trades/", json={
                "pair": "EURUSD", "direction": "BUY", "result": "WIN",
                "entry_price": 1.10, "exit_price": 1.105, "rr": 2.0,
                "weekly_bias": "BULLISH", "mss": True,
            })

        resp = client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/profile/build")
        assert resp.status_code == 200
        profile = resp.json()
        assert "discipline_score" in profile

    def test_get_profile(self, db, client):
        resp = client.post(f"{API_PREFIX}/projects/", json={"name": f"pte-{uuid4().hex[:8]}", "description": "test"})
        assert resp.status_code == 200
        project = resp.json()
        pid = UUID(project["id"])

        resp = client.get(f"{API_PREFIX}/projects/{pid}/trader-intelligence/profile")
        assert resp.status_code == 404

        client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/profile/build")
        resp = client.get(f"{API_PREFIX}/projects/{pid}/trader-intelligence/profile")
        assert resp.status_code == 200

    def test_get_snapshots(self, db, client):
        resp = client.post(f"{API_PREFIX}/projects/", json={"name": f"pte-{uuid4().hex[:8]}", "description": "test"})
        assert resp.status_code == 200
        project = resp.json()
        pid = UUID(project["id"])

        client.post(f"{API_PREFIX}/projects/{pid}/trader-intelligence/profile/build")
        resp = client.get(f"{API_PREFIX}/projects/{pid}/trader-intelligence/profile/snapshots")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_dashboard(self, db, client):
        resp = client.post(f"{API_PREFIX}/projects/", json={"name": f"pte-{uuid4().hex[:8]}", "description": "test"})
        assert resp.status_code == 200
        project = resp.json()
        pid = UUID(project["id"])

        resp = client.get(f"{API_PREFIX}/projects/{pid}/trader-intelligence/dashboard")
        assert resp.status_code == 200
        data = resp.json()
        assert "debrief_count" in data
