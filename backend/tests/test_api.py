import pytest


class TestHealthEndpoints:
    def test_root(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["project"] == "Project Minore"
        assert data["status"] == "running"
        assert "version" in data

    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "environment" in data

    def test_liveness(self, client):
        response = client.get("/liveness")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert "timestamp" in data

    def test_version(self, client):
        response = client.get("/version")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert "environment" in data


class TestAPIRoutes:
    def test_projects_list(self, client):
        response = client.get("/api/v1/projects/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_nonexistent_route(self, client):
        response = client.get("/api/v1/nonexistent")
        assert response.status_code in (404, 405)

    def test_root_has_request_id(self, client):
        response = client.get("/")
        assert "x-request-id" in response.headers


class TestSecurityHeaders:
    def test_security_headers_present(self, client):
        response = client.get("/")
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("x-frame-options") == "DENY"
        assert response.headers.get("x-xss-protection") == "1; mode=block"
        assert "cache-control" in response.headers
