from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.project import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectResponse,
    ProjectSummary
)
from app.services.project_service import ProjectService

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"]
)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    request: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar novo projeto

    Equivalente a: ProjectController.createProject()
    """
    try:
        project = ProjectService.create_project(request, current_user, db)
        response = ProjectService.convert_to_project_response(project)
        return response

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=List[ProjectSummary])
def list_user_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar projetos do usuário

    Equivalente a: ProjectController.listUserProjects()
    """
    try:
        projects = ProjectService.find_projects_by_user(current_user, db)
        return projects

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Buscar projeto por ID

    Equivalente a: ProjectController.getProject()
    """
    try:
        project = ProjectService.find_by_id(project_id, db)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )

        # Verificar se o usuário tem acesso ao projeto (é owner ou membro)
        if project.owner_id != current_user.id and current_user not in project.members:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado"
            )

        response = ProjectService.convert_to_project_response(project)
        return response

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    request: ProjectUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar projeto

    Equivalente a: ProjectController.updateProject()
    """
    try:
        if not request.has_updates():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhuma atualização fornecida"
            )

        updated_project = ProjectService.update_project(project_id, request, current_user, db)
        response = ProjectService.convert_to_project_response(updated_project)
        return response

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletar projeto

    Equivalente a: ProjectController.deleteProject()
    """
    try:
        ProjectService.delete_project(project_id, current_user, db)
        return None

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
