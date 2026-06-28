from app.auth import create_access_token, hash_password, verify_password, verify_token


def test_password_hashing_round_trip():
    password = "StrongPass123!"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_token_creation_and_verification():
    token = create_access_token(subject=7)
    payload = verify_token(token)

    assert payload["sub"] == "7"
