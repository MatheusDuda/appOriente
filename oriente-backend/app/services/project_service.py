from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from app.models.project import Project
from app.models.user import User
from app.schemas.project import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectResponse,
    ProjectSummary
)


class ProjectService:
    """
    Serviço de projetos
    Equivalente a: com.oriente.oriente_backend.service.ProjectService
    """

    @staticmethod
    def create_project(request: ProjectCreateRequest, owner: User, db: Session) -> Project:
        """
        Cria um novo projeto com o usuário autenticado como owner
        e adiciona membros baseado nos emails fornecidos
        """
        if not request.name or not request.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome do projeto é obrigatório"
            )

        # Criar projeto com owner
        project = Project(
            name=request.name,
            description=request.description,
            owner_id=owner.id
        )

        # Adicionar owner como membro automaticamente
        project.members.append(owner)

        # Adicionar membros adicionais baseado nos emails
        if request.member_emails:
            additional_members = ProjectService._find_users_by_emails(request.member_emails, db)

            # Adicionar membros únicos (evitar duplicatas)
            for member in additional_members:
                if member not in project.members:
                    project.members.append(member)

        # Salvar no banco
        db.add(project)
        db.commit()
        db.refresh(project)

        return project

    @staticmethod
    def find_by_id(project_id: int, db: Session) -> Optional[Project]:
        """
        Busca projeto por ID
        """
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def find_projects_by_user(user: User, db: Session) -> List[ProjectSummary]:
        """
        Lista todos os projetos do usuário (onde é owner ou membro)
        """
        # Buscar projetos onde o usuário é owner ou membro
        projects = db.query(Project).filter(
            (Project.owner_id == user.id) | (Project.members.contains(user))
        ).all()

        return [ProjectService._convert_to_project_summary(p) for p in projects]

    @staticmethod
    def update_project(
        project_id: int,
        request: ProjectUpdateRequest,
        current_user: User,
        db: Session
    ) -> Project:
        """
        Atualiza um projeto existente
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )

        # Verificar se o usuário tem permissão para atualizar
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o owner pode atualizar o projeto"
            )

        # Atualizar campos se fornecidos
        if request.name is not None:
            project.name = request.name
        if request.description is not None:
            project.description = request.description

        # Atualizar membros se fornecidos
        if request.member_emails is not None:
            new_members = ProjectService._find_users_by_emails(request.member_emails, db)
            project.members.clear()
            project.members.append(project.owner)  # Owner sempre é membro

            for member in new_members:
                if member not in project.members:
                    project.members.append(member)

        # Atualizar timestamp
        project.update_timestamp()

        db.commit()
        db.refresh(project)

        return project

    @staticmethod
    def delete_project(project_id: int, current_user: User, db: Session) -> None:
        """
        Remove um projeto
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )

        # Verificar se o usuário tem permissão para deletar
        if project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o owner pode deletar o projeto"
            )

        db.delete(project)
        db.commit()

    @staticmethod
    def convert_to_project_response(project: Project) -> ProjectResponse:
        """
        Converte Project para ProjectResponse
        """
        member_emails = [member.email for member in project.members]

        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            owner_email=project.owner.email,
            member_emails=member_emails,
            created_at=project.created_at,
            updated_at=project.updated_at
        )

    @staticmethod
    def _convert_to_project_summary(project: Project) -> ProjectSummary:
        """
        Converte Project para ProjectSummary
        """
        return ProjectSummary(
            id=project.id,
            name=project.name,
            description=project.description,
            owner_email=project.owner.email,
            member_count=len(project.members),
            created_at=project.created_at,
            updated_at=project.updated_at
        )

    @staticmethod
    def _find_users_by_emails(emails: List[str], db: Session) -> List[User]:
        """
        Método auxiliar para buscar usuários por lista de emails
        """
        users = []
        not_found_emails = []

        for email in emails:
            user = db.query(User).filter(User.email == email).first()
            if user:
                users.append(user)
            else:
                not_found_emails.append(email)

        # Se houver emails não encontrados, lançar exceção informativa
        if not_found_emails:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuários não encontrados para os emails: {', '.join(not_found_emails)}"
            )

        return users
