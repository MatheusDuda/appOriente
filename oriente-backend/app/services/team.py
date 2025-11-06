from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from typing import List, Optional
from fastapi import HTTPException, status

from app.models.team import Team, TeamStatus
from app.models.user import User, UserRole
from app.models.project import Project
from app.schemas.team import (
    TeamCreateRequest, TeamUpdateRequest, TeamMemberRequest,
    AddMembersResponse, RemoveMembersResponse
)

class TeamService:

    @staticmethod
    def create_team(db: Session, team_data: TeamCreateRequest, current_user_id: int) -> Team:
        """Criar nova equipe com validações e auto-adicionar lider como membro"""

        # Verificar se o usuário tem permissão (Só Admin pode criar equipes)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user or current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas administradores podem criar equipes"
            )

        # Verificar se líder existe
        leader = db.query(User).filter(User.id == team_data.leader_id).first()
        if not leader:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Líder não encontrado"
            )

        # Verificar se o nome da equipe ja existe
        existing_team = db.query(Team).filter(Team.name == team_data.name).first()
        if existing_team:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe uma equipe com este nome"
            )

        # Criar equipe
        team = Team(
            name=team_data.name,
            description=team_data.description,
            status=team_data.status,
            leader_id=team_data.leader_id
        )

        db.add(team)
        db.flush()  # Para obter o ID da equipe

        # Auto-adicionar lider como membro
        team.members.append(leader)

        # Adicionar outros membros se informados
        if team_data.member_ids:
            TeamService._add_members_to_team(db, team, team_data.member_ids)

        db.commit()
        db.refresh(team)

        return team

    @staticmethod
    def get_all_teams(db: Session, current_user_id: int) -> List[Team]:
        """Buscar todas as equipes com contagem de projetos"""

        # Verificar se usuário existe
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        teams = db.query(Team).options(
            joinedload(Team.leader),
            joinedload(Team.members),
            joinedload(Team.projects)
        ).filter(Team.status == TeamStatus.ACTIVE).all()

        return teams

    @staticmethod
    def get_team_by_id(db: Session, team_id: int, current_user_id: int) -> Team:
        """Buscar equipe por ID com detalhes completos"""

        team = db.query(Team).options(
            joinedload(Team.leader),
            joinedload(Team.members),
            joinedload(Team.projects)
        ).filter(Team.id == team_id).first()

        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipe não encontrada"
            )

        # Verificar se usuário tem acesso (membro da equipe ou admin)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Admin ou líder pode ver qualquer equipe
        if current_user.role == UserRole.ADMIN or team.leader_id == current_user_id:
            return team

        # Verificar se é membro da equipe
        if current_user in team.members:
            return team

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para acessar esta equipe"
        )

    @staticmethod
    def update_team(db: Session, team_id: int, team_data: TeamUpdateRequest, current_user_id: int) -> Team:
        """Atualizar equipe com validações e gestão de membros"""

        team = TeamService.get_team_by_id(db, team_id, current_user_id)

        # Verificar permissão de edição (líder da equipe ou admin)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not (current_user.role == UserRole.ADMIN or team.leader_id == current_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o líder da equipe ou administradores podem editá-la"
            )

        # Atualizar campos básicos
        update_data = team_data.model_dump(exclude_unset=True)

        # Verificar se nome já existe (se estiver sendo alterado)
        if 'name' in update_data and update_data['name'] != team.name:
            existing_team = db.query(Team).filter(
                and_(Team.name == update_data['name'], Team.id != team_id)
            ).first()
            if existing_team:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe uma equipe com este nome"
                )

        # Verificar se novo líder existe (se estiver sendo alterado)
        if 'leader_id' in update_data:
            new_leader = db.query(User).filter(User.id == update_data['leader_id']).first()
            if not new_leader:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Novo líder não encontrado"
                )

            # Remover líder antigo dos membros e adicionar novo
            old_leader = team.leader
            if old_leader and old_leader in team.members:
                team.members.remove(old_leader)

            if new_leader not in team.members:
                team.members.append(new_leader)

        # Aplicar atualizações
        for field, value in update_data.items():
            setattr(team, field, value)

        db.commit()
        db.refresh(team)

        return team

    @staticmethod
    def delete_team(db: Session, team_id: int, current_user_id: int) -> bool:
        """Deletar equipe com validação de projetos ativos"""

        team = TeamService.get_team_by_id(db, team_id, current_user_id)

        # Verificar permissão (apenas admin)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas administradores podem deletar equipes"
            )

        # Verificar se equipe tem projetos ativos
        if team.projects:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Não é possível deletar equipe que possui {len(team.projects)} projeto(s). Remova ou transfira os projetos primeiro."
            )

        # Deletar equipe
        db.delete(team)
        db.commit()

        return True

    @staticmethod
    def add_members(db: Session, team_id: int, member_request: TeamMemberRequest, current_user_id: int) -> AddMembersResponse:
        """Adicionar membros à equipe"""

        team = TeamService.get_team_by_id(db, team_id, current_user_id)

        # Verificar permissão (líder da equipe ou admin)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not (current_user.role == UserRole.ADMIN or team.leader_id == current_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o líder da equipe ou administradores podem adicionar membros"
            )

        # Buscar usuários
        users_to_add = db.query(User).filter(User.id.in_(member_request.user_ids)).all()
        found_user_ids = [user.id for user in users_to_add]
        not_found_ids = [uid for uid in member_request.user_ids if uid not in found_user_ids]

        # Separar usuários já membros dos novos
        current_member_ids = [member.id for member in team.members]
        new_members = [user for user in users_to_add if user.id not in current_member_ids]
        already_members = [user for user in users_to_add if user.id in current_member_ids]

        # Adicionar novos membros
        for member in new_members:
            team.members.append(member)

        db.commit()

        return AddMembersResponse(
            message=f"Adicionados {len(new_members)} novo(s) membro(s) à equipe",
            added_members=new_members,
            already_members=[f"{user.name} ({user.email})" for user in already_members],
            not_found=[str(uid) for uid in not_found_ids]
        )

    @staticmethod
    def remove_member(db: Session, team_id: int, user_id: int, current_user_id: int) -> bool:
        """Remover membro da equipe"""

        team = TeamService.get_team_by_id(db, team_id, current_user_id)

        # Verificar permissão (líder da equipe ou admin)
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not (current_user.role == UserRole.ADMIN or team.leader_id == current_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o líder da equipe ou administradores podem remover membros"
            )

        # Não permitir remover o líder
        if user_id == team.leader_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível remover o líder da equipe. Altere o líder primeiro."
            )

        # Buscar usuário
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Verificar se é membro
        if user not in team.members:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário não é membro desta equipe"
            )

        # Remover membro
        team.members.remove(user)
        db.commit()

        return True

    @staticmethod
    def get_team_stats(db: Session, team_id: int, current_user_id: int) -> dict:
        """Obter estatísticas da equipe"""

        team = TeamService.get_team_by_id(db, team_id, current_user_id)

        # Contar projetos ativos
        active_projects = len([p for p in team.projects if hasattr(p, 'is_active') and p.is_active])

        # Contar tasks (se existirem cards relacionados)
        completed_tasks = 0
        pending_tasks = 0

        for project in team.projects:
            if hasattr(project, 'cards'):
                for card in project.cards:
                    if hasattr(card, 'completed_at') and card.completed_at:
                        completed_tasks += 1
                    else:
                        pending_tasks += 1

        return {
            "team_id": team.id,
            "team_name": team.name,
            "total_members": len(team.members),
            "total_projects": len(team.projects),
            "active_projects": active_projects,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks
        }

    # === MÉTODOS AUXILIARES ===

    @staticmethod
    def _add_members_to_team(db: Session, team: Team, member_ids: List[int]):
        """Adicionar membros à equipe (método auxiliar)"""

        # Buscar usuários válidos
        valid_users = db.query(User).filter(User.id.in_(member_ids)).all()
        found_ids = [user.id for user in valid_users]

        # Verificar se todos os IDs foram encontrados
        not_found_ids = [uid for uid in member_ids if uid not in found_ids]
        if not_found_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Usuários não encontrados: {not_found_ids}"
            )

        # Adicionar apenas membros que ainda não estão na equipe
        current_member_ids = [member.id for member in team.members]
        new_members = [user for user in valid_users if user.id not in current_member_ids]

        team.members.extend(new_members)
