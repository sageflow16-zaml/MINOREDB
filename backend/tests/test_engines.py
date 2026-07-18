import pytest
from uuid import uuid4


class TestStatistics:
    def test_statistics_empty(self, client, db):
        project_id = uuid4()
        response = client.get(f"/api/v1/projects/{project_id}/statistics/summary")
        assert response.status_code in (200, 404)

    def test_statistics_trades(self, client, db):
        project_id = uuid4()
        response = client.get(f"/api/v1/projects/{project_id}/statistics/trades")
        assert response.status_code in (200, 404)


class TestPatterns:
    def test_patterns_list(self, client, db):
        project_id = uuid4()
        response = client.get(f"/api/v1/projects/{project_id}/patterns")
        assert response.status_code in (200, 404)
        if response.status_code == 200:
            assert isinstance(response.json(), list)

    def test_patterns_discover_empty(self, client, db):
        project_id = uuid4()
        response = client.post(f"/api/v1/projects/{project_id}/patterns/discover")
        assert response.status_code in (200, 404)


class TestSimilarity:
    def test_similarity_history(self, client, db):
        project_id = uuid4()
        response = client.get(f"/api/v1/projects/{project_id}/similarity/history")
        assert response.status_code in (200, 404)


class TestDecisionSupport:
    def test_decision_history(self, client, db):
        project_id = uuid4()
        response = client.get(f"/api/v1/projects/{project_id}/decision/history")
        assert response.status_code in (200, 404)


class TestLearning:
    def test_learning_events(self, client, db):
        project_id = uuid4()
        response = client.get(f"/api/v1/projects/{project_id}/learning/events")
        assert response.status_code in (200, 404)

    def test_learning_status(self, client, db):
        project_id = uuid4()
        response = client.get(f"/api/v1/projects/{project_id}/learning/status")
        assert response.status_code in (200, 404)
