import pytest
from fastapi.testclient import TestClient
from src.crud import source as crud, claim as claim_crud, concept as concept_crud
from src.schemas.source import SourceCreate
from uuid import uuid4

def test_source_upload_and_claim_extraction(client: TestClient, db):
    # Create a project first
    project_resp = client.post("/api/v1/projects/", json={"name": "test"})
    assert project_resp.status_code == 200
    project_id = project_resp.json()["id"]

    # Upload
    text = "Fair Value Gap above. Fair Value Gap below."
    response = client.post(f"/api/v1/projects/{project_id}/sources/upload", data={"text": text})
    assert response.status_code == 201
    source_id = response.json()["id"]

    # Extract
    response = client.post(f"/api/v1/projects/{project_id}/sources/{source_id}/extract-claims")
    assert response.status_code == 200
    assert response.json()["claims_created"] == 2
    
    claims = client.get(f"/api/v1/projects/{project_id}/claims/").json()
    assert len(claims) >= 2

def test_duplicate_prevention(client: TestClient, db):
    # Create a project first
    project_resp = client.post("/api/v1/projects/", json={"name": "dup"})
    assert project_resp.status_code == 200
    project_id = project_resp.json()["id"]

    # Upload same text twice
    text = "Duplicate Test."
    client.post(f"/api/v1/projects/{project_id}/sources/upload", data={"text": text})
    
    # Extract claims
    sources = client.get(f"/api/v1/projects/{project_id}/sources/").json()
    source_id = sources[-1]["id"]
    client.post(f"/api/v1/projects/{project_id}/sources/{source_id}/extract-claims")
    
    # Second extraction should yield 0 new claims
    response = client.post(f"/api/v1/projects/{project_id}/sources/{source_id}/extract-claims")
    assert response.json()["claims_created"] == 0