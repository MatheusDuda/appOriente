"""
Testes unitários para o módulo de equipes (Teams)
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from main import app
from app.models.user import User, UserRole
from app.models.team import Team, TeamStatus
from app.core.security import get_password_hash

# Configurar banco de teste em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_teams.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override da dependency get_db para usar banco de teste"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Criar tabelas no banco de teste"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Criar sessão de banco de dados para cada teste"""
    db = TestingSessionLocal()
    yield db
    db.close()


@pytest.fixture
def admin_user(db_session):
    """Criar usuário administrador para testes"""
    user = User(
        name="Admin Teste",
        email="admin@test.com",
        password=get_password_hash("admin123"),
        role=UserRole.ADMIN
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def regular_user(db_session):
    """Criar usuário comum para testes"""
    user = User(
        name="User Teste",
        email="user@test.com",
        password=get_password_hash("user123"),
        role=UserRole.USER
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def another_user(db_session):
    """Criar outro usuário para testes de membros"""
    user = User(
        name="Outro User",
        email="outro@test.com",
        password=get_password_hash("outro123"),
        role=UserRole.USER
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user):
    """Obter token de autenticação do admin"""
    response = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123"
    })
    return response.json()["data"]["token"]


@pytest.fixture
def user_token(regular_user):
    """Obter token de autenticação do usuário comum"""
    response = client.post("/api/auth/login", json={
        "email": "user@test.com",
        "password": "user123"
    })
    return response.json()["data"]["token"]


class TestTeamCreation:
    """Testes de criação de equipes"""

    def test_create_team_as_admin(self, admin_token, admin_user, db_session):
        """Teste: Admin pode criar equipe"""
        response = client.post(
            "/api/teams",
            json={
                "name": "Equipe Teste",
                "description": "Descrição da equipe",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Equipe Teste"
        assert data["leader"]["id"] == admin_user.id

    def test_create_team_as_regular_user_fails(self, user_token, admin_user):
        """Teste: Usuário comum não pode criar equipe"""
        response = client.post(
            "/api/teams",
            json={
                "name": "Equipe Teste 2",
                "description": "Teste",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )

        assert response.status_code == 403

    def test_create_team_duplicate_name(self, admin_token, admin_user, db_session):
        """Teste: Não pode criar equipe com nome duplicado"""
        # Criar primeira equipe
        client.post(
            "/api/teams",
            json={
                "name": "Equipe Duplicada",
                "description": "Primeira",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        # Tentar criar segunda equipe com mesmo nome
        response = client.post(
            "/api/teams",
            json={
                "name": "Equipe Duplicada",
                "description": "Segunda",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 400

    def test_create_team_with_initial_members(self, admin_token, admin_user, another_user):
        """Teste: Criar equipe com membros iniciais"""
        response = client.post(
            "/api/teams",
            json={
                "name": "Equipe com Membros",
                "description": "Teste",
                "leader_id": admin_user.id,
                "member_ids": [another_user.id],
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 201
        data = response.json()
        # Líder deve ser membro automaticamente
        assert len(data["members"]) >= 1


class TestTeamRetrieval:
    """Testes de busca de equipes"""

    def test_list_all_teams(self, admin_token, admin_user, db_session):
        """Teste: Listar todas as equipes"""
        # Criar equipe
        client.post(
            "/api/teams",
            json={
                "name": "Equipe para Listar",
                "description": "Teste",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        response = client.get(
            "/api/teams",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_get_team_by_id(self, admin_token, admin_user):
        """Teste: Buscar equipe por ID"""
        # Criar equipe
        create_response = client.post(
            "/api/teams",
            json={
                "name": "Equipe por ID",
                "description": "Teste",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        team_id = create_response.json()["id"]

        # Buscar equipe
        response = client.get(
            f"/api/teams/{team_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == team_id
        assert data["name"] == "Equipe por ID"

    def test_get_nonexistent_team(self, admin_token):
        """Teste: Buscar equipe inexistente"""
        response = client.get(
            "/api/teams/99999",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 404

    def test_list_my_teams(self, admin_token, admin_user):
        """Teste: Listar apenas minhas equipes"""
        # Criar equipe onde sou líder
        client.post(
            "/api/teams",
            json={
                "name": "Minha Equipe",
                "description": "Teste",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        response = client.get(
            "/api/teams/my-teams",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Deve ter pelo menos a equipe criada
        assert len(data) > 0


class TestTeamUpdate:
    """Testes de atualização de equipes"""

    def test_update_team_as_leader(self, admin_token, admin_user):
        """Teste: Líder pode atualizar equipe"""
        # Criar equipe
        create_response = client.post(
            "/api/teams",
            json={
                "name": "Equipe Original",
                "description": "Descrição original",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        team_id = create_response.json()["id"]

        # Atualizar equipe
        response = client.put(
            f"/api/teams/{team_id}",
            json={
                "name": "Equipe Atualizada",
                "description": "Descrição nova"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Equipe Atualizada"
        assert data["description"] == "Descrição nova"

    def test_update_team_change_leader(self, admin_token, admin_user, another_user):
        """Teste: Atualizar líder da equipe"""
        # Criar equipe
        create_response = client.post(
            "/api/teams",
            json={
                "name": "Equipe Trocar Líder",
                "description": "Teste",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        team_id = create_response.json()["id"]

        # Mudar líder
        response = client.put(
            f"/api/teams/{team_id}",
            json={"leader_id": another_user.id},
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["leader"]["id"] == another_user.id


class TestTeamDeletion:
    """Testes de exclusão de equipes"""

    def test_delete_team_as_admin(self, admin_token, admin_user):
        """Teste: Admin pode deletar equipe"""
        # Criar equipe
        create_response = client.post(
            "/api/teams",
            json={
                "name": "Equipe para Deletar",
                "description": "Teste",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        team_id = create_response.json()["id"]

        # Deletar equipe
        response = client.delete(
            f"/api/teams/{team_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 204

    def test_delete_team_as_regular_user_fails(self, user_token, admin_token, admin_user):
        """Teste: Usuário comum não pode deletar equipe"""
        # Criar equipe
        create_response = client.post(
            "/api/teams",
            json={
                "name": "Equipe Teste Delete",
                "description": "Teste",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        team_id = create_response.json()["id"]

        # Tentar deletar como usuário comum
        response = client.delete(
            f"/api/teams/{team_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )

        assert response.status_code == 403


class TestTeamMembers:
    """Testes de gestão de membros"""

    def test_add_members(self, admin_token, admin_user, another_user):
        """Teste: Adicionar membros à equipe"""
        # Criar equipe
        create_response = client.post(
            "/api/teams",
            json={
                "name": "Equipe Add Membros",
                "description": "Teste",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        team_id = create_response.json()["id"]

        # Adicionar membros
        response = client.post(
            f"/api/teams/{team_id}/members",
            json={"user_ids": [another_user.id]},
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "added_members" in data

    def test_remove_member(self, admin_token, admin_user, another_user):
        """Teste: Remover membro da equipe"""
        # Criar equipe com membro
        create_response = client.post(
            "/api/teams",
            json={
                "name": "Equipe Remove Membro",
                "description": "Teste",
                "leader_id": admin_user.id,
                "member_ids": [another_user.id],
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        team_id = create_response.json()["id"]

        # Remover membro
        response = client.delete(
            f"/api/teams/{team_id}/members/{another_user.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 204

    def test_cannot_remove_leader(self, admin_token, admin_user):
        """Teste: Não pode remover o líder da equipe"""
        # Criar equipe
        create_response = client.post(
            "/api/teams",
            json={
                "name": "Equipe Teste Líder",
                "description": "Teste",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        team_id = create_response.json()["id"]

        # Tentar remover líder
        response = client.delete(
            f"/api/teams/{team_id}/members/{admin_user.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 400


class TestTeamStats:
    """Testes de estatísticas da equipe"""

    def test_get_team_stats(self, admin_token, admin_user):
        """Teste: Obter estatísticas da equipe"""
        # Criar equipe
        create_response = client.post(
            "/api/teams",
            json={
                "name": "Equipe Stats",
                "description": "Teste",
                "leader_id": admin_user.id,
                "status": "active"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        team_id = create_response.json()["id"]

        # Buscar stats
        response = client.get(
            f"/api/teams/{team_id}/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "team_id" in data
        assert "total_members" in data
        assert "total_projects" in data
