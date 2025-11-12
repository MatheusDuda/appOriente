"""
Router para endpoints de relatórios e métricas
"""
from fastapi import APIRouter, Depends, Query, Path
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.report import (
    UserEfficiencyReportResponse,
    ProjectReportResponse,
    TeamEfficiencyReportResponse,
    ReportPeriodPreset
)
from app.services.report_service import ReportService


router = APIRouter()


@router.get(
    "/user/{user_id}/efficiency",
    response_model=UserEfficiencyReportResponse,
    summary="Relatório de eficiência do usuário",
    description="""
    Gera relatório de eficiência de um usuário específico.

    **Métricas incluídas:**
    - Total de tarefas atribuídas no período
    - Tarefas concluídas vs pendentes
    - Taxa de eficiência (% de conclusão)
    - Tempo médio de conclusão
    - Tarefas atrasadas
    - Distribuição por prioridade
    - Projetos envolvidos
    - Atividade total no histórico

    **Permissões:**
    - Usuários podem ver apenas seus próprios relatórios
    - Admins podem ver qualquer relatório
    - Membros de projeto podem ver relatórios do projeto
    """,
    tags=["Reports"]
)
def get_user_efficiency_report(
    user_id: int = Path(..., description="ID do usuário a ser analisado"),
    start_date: Optional[datetime] = Query(
        None,
        description="Data inicial do período (ISO 8601). Se não fornecido, usa preset ou padrão de 30 dias"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="Data final do período (ISO 8601). Se não fornecido, usa data atual"
    ),
    period_preset: Optional[ReportPeriodPreset] = Query(
        None,
        description="Preset de período (ignora start_date e end_date se fornecido)"
    ),
    project_id: Optional[int] = Query(
        None,
        description="Filtrar por projeto específico (opcional)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para obter relatório de eficiência de um usuário
    """
    return ReportService.generate_user_efficiency_report(
        db=db,
        user_id=user_id,
        current_user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        period_preset=period_preset.value if period_preset else None,
        project_id=project_id
    )


@router.get(
    "/user/me/efficiency",
    response_model=UserEfficiencyReportResponse,
    summary="Relatório de eficiência do usuário atual",
    description="""
    Gera relatório de eficiência do usuário autenticado (você mesmo).

    Este é um atalho conveniente para `/user/{user_id}/efficiency` usando o ID do usuário atual.
    """,
    tags=["Reports"]
)
def get_my_efficiency_report(
    start_date: Optional[datetime] = Query(
        None,
        description="Data inicial do período (ISO 8601)"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="Data final do período (ISO 8601)"
    ),
    period_preset: Optional[ReportPeriodPreset] = Query(
        None,
        description="Preset de período"
    ),
    project_id: Optional[int] = Query(
        None,
        description="Filtrar por projeto específico"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para o usuário obter seu próprio relatório de eficiência
    """
    return ReportService.generate_user_efficiency_report(
        db=db,
        user_id=current_user.id,
        current_user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        period_preset=period_preset.value if period_preset else None,
        project_id=project_id
    )


@router.get(
    "/project/{project_id}/summary",
    response_model=ProjectReportResponse,
    summary="Relatório resumido do projeto",
    description="""
    Gera relatório resumido de um projeto.

    **Métricas incluídas:**
    - Métricas gerais de tarefas (total, concluídas, pendentes, atrasadas)
    - Taxa de conclusão do projeto
    - Distribuição de tarefas por prioridade
    - Distribuição de tarefas por coluna Kanban
    - Total de membros
    - Top 10 contribuidores do projeto

    **Permissões:**
    - Usuário deve ter acesso ao projeto (owner ou membro)
    """,
    tags=["Reports"]
)
def get_project_report_summary(
    project_id: int = Path(..., description="ID do projeto"),
    start_date: Optional[datetime] = Query(
        None,
        description="Data inicial do período (ISO 8601)"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="Data final do período (ISO 8601)"
    ),
    period_preset: Optional[ReportPeriodPreset] = Query(
        None,
        description="Preset de período"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para obter relatório resumido do projeto
    """
    return ReportService.generate_project_report(
        db=db,
        project_id=project_id,
        current_user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        period_preset=period_preset.value if period_preset else None
    )


@router.get(
    "/project/{project_id}/team-efficiency",
    response_model=TeamEfficiencyReportResponse,
    summary="Relatório de eficiência da equipe",
    description="""
    Gera relatório de eficiência da equipe de um projeto.

    **Métricas incluídas:**
    - Métricas gerais de tarefas da equipe
    - Eficiência individual de cada membro
    - Taxa média de eficiência da equipe
    - Membro mais produtivo do período

    **Permissões:**
    - Usuário deve ter acesso ao projeto (owner ou membro)
    """,
    tags=["Reports"]
)
def get_team_efficiency_report(
    project_id: int = Path(..., description="ID do projeto"),
    start_date: Optional[datetime] = Query(
        None,
        description="Data inicial do período (ISO 8601)"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="Data final do período (ISO 8601)"
    ),
    period_preset: Optional[ReportPeriodPreset] = Query(
        None,
        description="Preset de período"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para obter relatório de eficiência da equipe
    """
    return ReportService.generate_team_efficiency_report(
        db=db,
        project_id=project_id,
        current_user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        period_preset=period_preset.value if period_preset else None
    )


# === ENDPOINTS DE DOWNLOAD (PDF) ===

@router.get(
    "/user/{user_id}/efficiency/download",
    summary="Download do relatório de eficiência do usuário (PDF)",
    description="""
    Gera e baixa o relatório de eficiência de um usuário em formato PDF.

    O PDF inclui todas as métricas de eficiência formatadas em tabelas.
    """,
    tags=["Reports"],
    response_class=StreamingResponse
)
def download_user_efficiency_report(
    user_id: int = Path(..., description="ID do usuário a ser analisado"),
    start_date: Optional[datetime] = Query(
        None,
        description="Data inicial do período (ISO 8601)"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="Data final do período (ISO 8601)"
    ),
    period_preset: Optional[ReportPeriodPreset] = Query(
        None,
        description="Preset de período"
    ),
    project_id: Optional[int] = Query(
        None,
        description="Filtrar por projeto específico"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para download do relatório de eficiência do usuário em PDF
    """
    # Gerar PDF
    pdf_buffer = ReportService.generate_user_efficiency_pdf(
        db=db,
        user_id=user_id,
        current_user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        period_preset=period_preset.value if period_preset else None,
        project_id=project_id
    )

    # Obter dados para nome do arquivo
    from app.models.user import User as UserModel
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    filename = f"relatorio_eficiencia_{user.name.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"

    # Retornar como download
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get(
    "/user/me/efficiency/download",
    summary="Download do relatório de eficiência do usuário atual (PDF)",
    description="""
    Gera e baixa o relatório de eficiência do usuário autenticado em formato PDF.

    Atalho conveniente para download do próprio relatório.
    """,
    tags=["Reports"],
    response_class=StreamingResponse
)
def download_my_efficiency_report(
    start_date: Optional[datetime] = Query(
        None,
        description="Data inicial do período (ISO 8601)"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="Data final do período (ISO 8601)"
    ),
    period_preset: Optional[ReportPeriodPreset] = Query(
        None,
        description="Preset de período"
    ),
    project_id: Optional[int] = Query(
        None,
        description="Filtrar por projeto específico"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para download do próprio relatório de eficiência em PDF
    """
    # Gerar PDF
    pdf_buffer = ReportService.generate_user_efficiency_pdf(
        db=db,
        user_id=current_user.id,
        current_user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        period_preset=period_preset.value if period_preset else None,
        project_id=project_id
    )

    filename = f"relatorio_eficiencia_{current_user.name.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"

    # Retornar como download
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get(
    "/project/{project_id}/summary/download",
    summary="Download do relatório do projeto (PDF)",
    description="""
    Gera e baixa o relatório resumido do projeto em formato PDF.

    O PDF inclui métricas gerais, distribuição por prioridade e top contribuidores.
    """,
    tags=["Reports"],
    response_class=StreamingResponse
)
def download_project_report(
    project_id: int = Path(..., description="ID do projeto"),
    start_date: Optional[datetime] = Query(
        None,
        description="Data inicial do período (ISO 8601)"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="Data final do período (ISO 8601)"
    ),
    period_preset: Optional[ReportPeriodPreset] = Query(
        None,
        description="Preset de período"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para download do relatório do projeto em PDF
    """
    # Gerar PDF
    pdf_buffer = ReportService.generate_project_pdf(
        db=db,
        project_id=project_id,
        current_user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        period_preset=period_preset.value if period_preset else None
    )

    # Obter dados para nome do arquivo
    from app.models.project import Project
    project = db.query(Project).filter(Project.id == project_id).first()
    filename = f"relatorio_projeto_{project.name.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"

    # Retornar como download
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get(
    "/project/{project_id}/team-efficiency/download",
    summary="Download do relatório de eficiência da equipe (PDF)",
    description="""
    Gera e baixa o relatório de eficiência da equipe do projeto em formato PDF.

    O PDF inclui métricas gerais da equipe e eficiência individual de cada membro.
    """,
    tags=["Reports"],
    response_class=StreamingResponse
)
def download_team_efficiency_report(
    project_id: int = Path(..., description="ID do projeto"),
    start_date: Optional[datetime] = Query(
        None,
        description="Data inicial do período (ISO 8601)"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="Data final do período (ISO 8601)"
    ),
    period_preset: Optional[ReportPeriodPreset] = Query(
        None,
        description="Preset de período"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para download do relatório de eficiência da equipe em PDF
    """
    # Gerar PDF
    pdf_buffer = ReportService.generate_team_efficiency_pdf(
        db=db,
        project_id=project_id,
        current_user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        period_preset=period_preset.value if period_preset else None
    )

    # Obter dados para nome do arquivo
    from app.models.project import Project
    project = db.query(Project).filter(Project.id == project_id).first()
    filename = f"relatorio_equipe_{project.name.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"

    # Retornar como download
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
