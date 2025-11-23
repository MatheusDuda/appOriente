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

        # Criar projeto com owner e team
        project = Project(
            name=request.name,
            description=request.description,
            owner_id=owner.id,
            team_id=request.team_id
        )

        # Adicionar owner como membro automaticamente
        project.members.append(owner)

        # Adicionar membros adicionais baseado nos nomes
        if request.member_names:
            additional_members = ProjectService._find_users_by_names(request.member_names, db)

            # Adicionar membros únicos (evitar duplicatas)
            for member in additional_members:
                if member not in project.members:
                    project.members.append(member)

        # Salvar no banco
        db.add(project)
        db.commit()
        db.refresh(project)

        # Criar colunas padrão do Kanban (import aqui para evitar circular import)
        from app.services.column_service import ColumnService
        ColumnService.create_default_columns(db, project.id)

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

        # Atualizar responsável/líder do projeto se fornecido
        if request.new_owner_name is not None:
            # Buscar novo owner
            new_owner = db.query(User).filter(User.name == request.new_owner_name).first()
            if not new_owner:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Usuário '{request.new_owner_name}' não encontrado"
                )

            # Validar que o novo owner é membro do projeto
            if new_owner not in project.members:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="O novo responsável deve ser um membro do projeto"
                )

            # Transferir ownership
            project.owner_id = new_owner.id

        # Atualizar membros se fornecidos
        if request.member_names is not None:
            new_members = ProjectService._find_users_by_names(request.member_names, db)
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
        Remove um projeto (apenas ADMIN)
        """
        from app.models.user import UserRole

        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )

        # Verificar se o usuário tem permissão para deletar (apenas ADMIN)
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas administradores podem deletar projetos"
            )

        db.delete(project)
        db.commit()

    @staticmethod
    def convert_to_project_response(project: Project) -> ProjectResponse:
        """
        Converte Project para ProjectResponse
        """
        member_names = [member.name for member in project.members]

        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            owner_email=project.owner.email,
            member_names=member_names,
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
    def _find_users_by_names(names: List[str], db: Session) -> List[User]:
        """
        Método auxiliar para buscar usuários por lista de nomes
        """
        users = []
        not_found_names = []

        for name in names:
            user = db.query(User).filter(User.name == name).first()
            if user:
                users.append(user)
            else:
                not_found_names.append(name)

        # Se houver nomes não encontrados, lançar exceção informativa
        if not_found_names:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuários não encontrados para os nomes: {', '.join(not_found_names)}"
            )

        return users

    @staticmethod
    def user_can_access_project(db: Session, project_id: int, user_id: int) -> bool:
        """
        Verifica se o usuário tem acesso ao projeto
        (é owner ou membro do projeto)
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return False

        # Verificar se é owner
        if project.owner_id == user_id:
            return True

        # Verificar se é membro
        user = db.query(User).filter(User.id == user_id).first()
        if user and user in project.members:
            return True

        return False

    @staticmethod
    def user_can_edit_project(db: Session, project_id: int, user_id: int) -> bool:
        """
        Verifica se o usuário tem permissão para editar o projeto
        (owner, membro do projeto, ou MANAGER)
        """
        from app.models.user import UserRole

        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return False

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        # MANAGER pode editar qualquer projeto
        if user.role == UserRole.MANAGER:
            return True

        # Verificar se é owner
        if project.owner_id == user_id:
            return True

        # Verificar se é membro
        if user in project.members:
            return True

        return False
