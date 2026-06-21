import pytest
from fastapi.testclient import TestClient
from main import app
from valkey_client.client import valkey

@pytest.fixture(autouse=True)
def clean_valkey():
    # Connect client
    valkey.connect()
    client = valkey.get_client()
    
    # Clean keys matching 'memoryos:*' before test run
    keys = client.keys("memoryos:*")
    if keys:
        client.delete(*keys)
        
    yield
    
    # Clean keys matching 'memoryos:*' after test run
    keys = client.keys("memoryos:*")
    if keys:
        client.delete(*keys)

@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c
