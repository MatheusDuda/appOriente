from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.team import (
    TeamCreateRequest,
    TeamUpdateRequest,
    TeamResponse,
    TeamListResponse,
    TeamDetailedResponse,
    TeamMemberRequest,
    AddMembersResponse
)
from app.services.team import TeamService

router = APIRouter(
    prefix="/api/teams",
    tags=["teams"]
)


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    request: TeamCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar nova equipe (apenas ADMIN)

    - Apenas administradores podem criar equipes
    - O líder é automaticamente adicionado como membro
    - É possível adicionar membros iniciais
    """
    try:
        team = TeamService.create_team(db, request, current_user.id)
        return TeamResponse.model_validate(team)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=List[TeamListResponse])
def list_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar todas as equipes ativas

    - Retorna todas as equipes com status ACTIVE
    - Inclui contagem de projetos e membros
    """
    try:
        teams = TeamService.get_all_teams(db, current_user.id)
        return [TeamListResponse.model_validate(team) for team in teams]
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/my-teams", response_model=List[TeamListResponse])
def list_my_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar equipes do usuário atual

    - Retorna equipes onde o usuário é líder ou membro
    """
    try:
        # Buscar equipes onde o usuário é membro ou líder
        all_teams = TeamService.get_all_teams(db, current_user.id)
        my_teams = [
            team for team in all_teams
            if team.leader_id == current_user.id or current_user in team.members
        ]
        return [TeamListResponse.model_validate(team) for team in my_teams]
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{team_id}", response_model=TeamDetailedResponse)
def get_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Buscar equipe por ID

    - Retorna detalhes completos da equipe
    - Requer que o usuário seja membro, líder ou admin
    """
    try:
        team = TeamService.get_team_by_id(db, team_id, current_user.id)
        return TeamDetailedResponse.model_validate(team)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: int,
    request: TeamUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar equipe

    - Apenas líder ou ADMIN podem atualizar
    - Pode alterar nome, descrição, status e líder
    - Ao alterar o líder, ele é automaticamente adicionado como membro
    """
    try:
        team = TeamService.update_team(db, team_id, request, current_user.id)
        return TeamResponse.model_validate(team)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletar equipe (apenas ADMIN)

    - Apenas administradores podem deletar equipes
    - Não é possível deletar equipes com projetos ativos
    - Transfira ou remova os projetos primeiro
    """
    try:
        TeamService.delete_team(db, team_id, current_user.id)
        return None
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{team_id}/members", response_model=AddMembersResponse)
def add_team_members(
    team_id: int,
    request: TeamMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Adicionar membros à equipe

    - Apenas líder ou ADMIN podem adicionar membros
    - Retorna lista de membros adicionados e já existentes
    - Informa IDs de usuários não encontrados
    """
    try:
        result = TeamService.add_members(db, team_id, request, current_user.id)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remover membro da equipe

    - Apenas líder ou ADMIN podem remover membros
    - Não é possível remover o líder da equipe
    - Para trocar o líder, use PUT /teams/{team_id}
    """
    try:
        TeamService.remove_member(db, team_id, user_id, current_user.id)
        return None
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{team_id}/stats")
def get_team_stats(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter estatísticas da equipe

    - Total de membros
    - Total de projetos e projetos ativos
    - Tasks completadas e pendentes
    - Requer que o usuário seja membro, líder ou admin
    """
    try:
        stats = TeamService.get_team_stats(db, team_id, current_user.id)
        return stats
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
