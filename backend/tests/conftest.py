import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters!!")
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://minore:minore@localhost:5432/minore_test")

from src.main import app
from src.api.deps import get_db, get_current_user
from src.db.session import Base
from src.models.user import User
from src.core.security import hash_password

SQLALCHEMY_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://minore:minore@localhost:5432/minore_test",
)
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


_test_user_id = uuid.uuid4()


def _create_test_user(db):
    existing = db.query(User).filter(User.email == "test@minore.app").first()
    if existing:
        return existing
    user = User(
        id=_test_user_id,
        email="test@minore.app",
        hashed_password=hash_password("testpassword123"),
        name="Test User",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _override_get_current_user():
    db = TestingSessionLocal()
    try:
        user = _create_test_user(db)
        return user
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = _override_get_current_user


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    yield db
    db.close()


@pytest.fixture
def test_user(db):
    return _create_test_user(db)


@pytest.fixture
def auth_headers(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@minore.app", "password": "testpassword123"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
