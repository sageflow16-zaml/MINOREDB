import pytest


class TestMacro:
    def test_macro_snapshot(self, client):
        response = client.get("/api/v1/macro/snapshot")
        assert response.status_code == 200

    def test_macro_events(self, client):
        response = client.get("/api/v1/macro/events")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_macro_calendar(self, client):
        response = client.get("/api/v1/macro/calendar")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_macro_state(self, client):
        response = client.get("/api/v1/macro/state")
        assert response.status_code == 200
        data = response.json()
        assert "snapshot" in data
        assert "events_today" in data

    def test_macro_refresh(self, client):
        response = client.post("/api/v1/macro/refresh")
        assert response.status_code == 200
        data = response.json()
        assert "events_stored" in data
        assert "duration_ms" in data


class TestMT5:
    def test_mt5_status(self, client):
        response = client.get("/api/v1/mt5/status")
        assert response.status_code == 200
        data = response.json()
        assert "connected" in data
        assert "total_trades" in data

    def test_mt5_logs(self, client):
        response = client.get("/api/v1/mt5/logs")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_mt5_disconnect(self, client):
        response = client.post("/api/v1/mt5/disconnect")
        assert response.status_code == 200


class TestTradingView:
    def test_tv_events(self, client):
        response = client.get("/api/v1/tradingview/events")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_tv_logs(self, client):
        response = client.get("/api/v1/tradingview/logs")
        assert response.status_code == 200

    def test_tv_stats(self, client):
        response = client.get("/api/v1/tradingview/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_events" in data

    def test_tv_webhook_invalid(self, client):
        response = client.post("/api/v1/tradingview/webhook", json={})
        assert response.status_code == 400

    def test_tv_webhook_valid(self, client):
        response = client.post("/api/v1/tradingview/webhook", json={
            "symbol": "EURUSD",
            "timeframe": "H1",
            "event_type": "break_of_structure",
            "price": 1.1200,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "event_id" in data
