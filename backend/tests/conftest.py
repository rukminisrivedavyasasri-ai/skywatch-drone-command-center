import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["SECRET_KEY"] = "test_secret_key_ciphercop_hackathon_2026"

from backend.app.main import app
from backend.app.models.models import Base, User
from backend.app.db.session import get_db
from backend.app.core.security import create_access_token, hash_password

TEST_DB_URL = "sqlite:///./test_skywatch.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    # Seed test users
    db = TestingSessionLocal()
    if db.query(User).filter(User.username == "admin").count() == 0:
        admin_user = User(
            username="admin",
            hashed_password=hash_password("Admin@SkyWatch2026"),
            full_name="Chief Inspector Sarah Chen",
            role="ADMIN",
            is_active=True
        )
        op_user = User(
            username="operator",
            hashed_password=hash_password("Operator@SkyWatch2026"),
            full_name="Marcus Vance",
            role="OPERATOR",
            is_active=True
        )
        db.add_all([admin_user, op_user])
        db.commit()
    db.close()
    
    yield
    
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_skywatch.db"):
        try:
            os.remove("./test_skywatch.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token():
    return create_access_token(data={"sub": "admin", "role": "ADMIN"})

@pytest.fixture
def operator_token():
    return create_access_token(data={"sub": "operator", "role": "OPERATOR"})
