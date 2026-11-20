from backend.app.core.security import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hashing():
    raw = "CipherCop2026Secure!"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_generation_and_decoding():
    payload = {"sub": "inspector_chen", "role": "ADMIN"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "inspector_chen"
    assert decoded["role"] == "ADMIN"

def test_jwt_invalid_token():
    decoded = decode_access_token("invalid.token.signature")
    assert decoded is None

def test_login_api_success(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "Admin@SkyWatch2026"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "ADMIN"

def test_login_api_failure(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "IncorrectPassword"}
    )
    assert response.status_code == 401
