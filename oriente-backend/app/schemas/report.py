"""
Schemas para o módulo de relatórios
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum


# === ENUMS ===

class ReportPeriodPreset(str, Enum):
    """Presets de período para relatórios"""
    LAST_WEEK = "last_week"
    LAST_MONTH = "last_month"
    LAST_QUARTER = "last_quarter"
    LAST_YEAR = "last_year"
    CUSTOM = "custom"


class ReportType(str, Enum):
    """Tipos de relatórios disponíveis"""
    USER_EFFICIENCY = "user_efficiency"
    PROJECT_SUMMARY = "project_summary"
    TEAM_EFFICIENCY = "team_efficiency"


# === SUB-SCHEMAS (COMPONENTES) ===

class TaskMetrics(BaseModel):
    """Métricas de tarefas"""
    total: int = Field(..., description="Total de tarefas")
    completed: int = Field(..., description="Tarefas concluídas")
    pending: int = Field(..., description="Tarefas pendentes")
    overdue: int = Field(..., description="Tarefas atrasadas")
    completion_rate: float = Field(..., ge=0, le=100, description="Taxa de conclusão (%)")

    class Config:
        json_schema_extra = {
            "example": {
                "total": 50,
                "completed": 35,
                "pending": 15,
                "overdue": 5,
                "completion_rate": 70.0
            }
        }


class PriorityDistribution(BaseModel):
    """Distribuição de tarefas por prioridade"""
    urgent: int = Field(0, description="Tarefas urgentes")
    high: int = Field(0, description="Tarefas de alta prioridade")
    medium: int = Field(0, description="Tarefas de prioridade média")
    low: int = Field(0, description="Tarefas de baixa prioridade")

    class Config:
        json_schema_extra = {
            "example": {
                "urgent": 5,
                "high": 12,
                "medium": 20,
                "low": 8
            }
        }


class TimeMetrics(BaseModel):
    """Métricas de tempo"""
    average_completion_time_hours: Optional[float] = Field(
        None,
        description="Tempo médio de conclusão em horas"
    )
    completed_on_time: int = Field(0, description="Tarefas concluídas no prazo")
    completed_late: int = Field(0, description="Tarefas concluídas atrasadas")

    class Config:
        json_schema_extra = {
            "example": {
                "average_completion_time_hours": 48.5,
                "completed_on_time": 28,
                "completed_late": 7
            }
        }


class UserProductivity(BaseModel):
    """Produtividade de um usuário"""
    user_id: int = Field(..., description="ID do usuário")
    user_name: str = Field(..., description="Nome do usuário")
    user_email: str = Field(..., description="Email do usuário")
    tasks_assigned: int = Field(0, description="Tarefas atribuídas")
    tasks_completed: int = Field(0, description="Tarefas concluídas")
    efficiency_rate: float = Field(
        0.0,
        ge=0,
        le=100,
        description="Taxa de eficiência (%)"
    )
    activity_count: int = Field(0, description="Total de atividades registradas")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "user_name": "João Silva",
                "user_email": "joao@example.com",
                "tasks_assigned": 25,
                "tasks_completed": 20,
                "efficiency_rate": 80.0,
                "activity_count": 150
            }
        }


class ColumnDistribution(BaseModel):
    """Distribuição de tarefas por coluna Kanban"""
    column_title: str = Field(..., description="Título da coluna")
    card_count: int = Field(..., description="Quantidade de cards")

    class Config:
        json_schema_extra = {
            "example": {
                "column_title": "Em Progresso",
                "card_count": 8
            }
        }


# === REQUEST SCHEMAS ===

class ReportFilterRequest(BaseModel):
    """Filtros para geração de relatórios"""
    start_date: Optional[datetime] = Field(None, description="Data inicial do período")
    end_date: Optional[datetime] = Field(None, description="Data final do período")
    period_preset: Optional[ReportPeriodPreset] = Field(
        None,
        description="Preset de período (ignora start_date e end_date se fornecido)"
    )
    project_id: Optional[int] = Field(None, description="Filtrar por projeto específico")

    class Config:
        json_schema_extra = {
            "example": {
                "start_date": "2024-01-01T00:00:00",
                "end_date": "2024-01-31T23:59:59",
                "period_preset": None,
                "project_id": 1
            }
        }


# === RESPONSE SCHEMAS ===

class UserEfficiencyReportResponse(BaseModel):
    """Relatório de eficiência de um usuário"""
    user_id: int = Field(..., description="ID do usuário")
    user_name: str = Field(..., description="Nome do usuário")
    user_email: str = Field(..., description="Email do usuário")
    period_start: datetime = Field(..., description="Início do período analisado")
    period_end: datetime = Field(..., description="Fim do período analisado")

    # Métricas principais
    task_metrics: TaskMetrics = Field(..., description="Métricas de tarefas")
    time_metrics: TimeMetrics = Field(..., description="Métricas de tempo")
    priority_distribution: PriorityDistribution = Field(
        ...,
        description="Distribuição por prioridade"
    )

    # Projetos em que participou
    projects_involved: List[Dict[str, Any]] = Field(
        ...,
        description="Projetos onde o usuário teve atividade"
    )

    # Atividade geral
    total_activity_count: int = Field(
        ...,
        description="Total de ações registradas no histórico"
    )

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "user_name": "João Silva",
                "user_email": "joao@example.com",
                "period_start": "2024-01-01T00:00:00",
                "period_end": "2024-01-31T23:59:59",
                "task_metrics": {
                    "total": 50,
                    "completed": 35,
                    "pending": 15,
                    "overdue": 5,
                    "completion_rate": 70.0
                },
                "time_metrics": {
                    "average_completion_time_hours": 48.5,
                    "completed_on_time": 28,
                    "completed_late": 7
                },
                "priority_distribution": {
                    "urgent": 5,
                    "high": 12,
                    "medium": 20,
                    "low": 8
                },
                "projects_involved": [
                    {"project_id": 1, "project_name": "Projeto A", "task_count": 25},
                    {"project_id": 2, "project_name": "Projeto B", "task_count": 25}
                ],
                "total_activity_count": 150
            }
        }


class ProjectReportResponse(BaseModel):
    """Relatório resumido de um projeto"""
    project_id: int = Field(..., description="ID do projeto")
    project_name: str = Field(..., description="Nome do projeto")
    project_description: str = Field(..., description="Descrição do projeto")
    period_start: datetime = Field(..., description="Início do período analisado")
    period_end: datetime = Field(..., description="Fim do período analisado")

    # Métricas do projeto
    task_metrics: TaskMetrics = Field(..., description="Métricas de tarefas")
    priority_distribution: PriorityDistribution = Field(
        ...,
        description="Distribuição por prioridade"
    )
    column_distribution: List[ColumnDistribution] = Field(
        ...,
        description="Distribuição de tarefas por coluna"
    )

    # Equipe
    total_members: int = Field(..., description="Total de membros no projeto")
    top_contributors: List[UserProductivity] = Field(
        ...,
        description="Top 10 contribuidores do projeto"
    )

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "project_id": 1,
                "project_name": "Sistema de Gestão",
                "project_description": "Sistema web para gestão de projetos",
                "period_start": "2024-01-01T00:00:00",
                "period_end": "2024-01-31T23:59:59",
                "task_metrics": {
                    "total": 100,
                    "completed": 70,
                    "pending": 30,
                    "overdue": 10,
                    "completion_rate": 70.0
                },
                "priority_distribution": {
                    "urgent": 10,
                    "high": 25,
                    "medium": 45,
                    "low": 20
                },
                "column_distribution": [
                    {"column_title": "A Fazer", "card_count": 15},
                    {"column_title": "Em Progresso", "card_count": 10},
                    {"column_title": "Concluído", "card_count": 70}
                ],
                "total_members": 8,
                "top_contributors": []
            }
        }


class TeamEfficiencyReportResponse(BaseModel):
    """Relatório de eficiência da equipe de um projeto"""
    project_id: int = Field(..., description="ID do projeto")
    project_name: str = Field(..., description="Nome do projeto")
    period_start: datetime = Field(..., description="Início do período analisado")
    period_end: datetime = Field(..., description="Fim do período analisado")

    # Métricas gerais da equipe
    team_task_metrics: TaskMetrics = Field(..., description="Métricas gerais de tarefas")

    # Eficiência individual de cada membro
    members_efficiency: List[UserProductivity] = Field(
        ...,
        description="Eficiência individual de cada membro da equipe"
    )

    # Estatísticas da equipe
    average_efficiency_rate: float = Field(
        ...,
        ge=0,
        le=100,
        description="Taxa média de eficiência da equipe (%)"
    )
    most_productive_member: Optional[UserProductivity] = Field(
        None,
        description="Membro mais produtivo"
    )

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "project_id": 1,
                "project_name": "Sistema de Gestão",
                "period_start": "2024-01-01T00:00:00",
                "period_end": "2024-01-31T23:59:59",
                "team_task_metrics": {
                    "total": 100,
                    "completed": 70,
                    "pending": 30,
                    "overdue": 10,
                    "completion_rate": 70.0
                },
                "members_efficiency": [],
                "average_efficiency_rate": 72.5,
                "most_productive_member": None
            }
        }
