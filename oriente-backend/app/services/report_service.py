"""
Service para geração de relatórios e métricas
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, case
from typing import Optional, List, Dict, Tuple
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from io import BytesIO

# ReportLab imports para geração de PDF
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.models.Card import Card, CardStatus, CardPriority
from app.models.project import Project
from app.models.Column import KanbanColumn
from app.models.card_history import CardHistory, CardHistoryAction
from app.models.user import User
from app.services.project_service import ProjectService


class ReportService:
    """
    Service para geração de relatórios e análise de métricas de produtividade
    """

    @staticmethod
    def _parse_period(
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        period_preset: Optional[str] = None
    ) -> Tuple[datetime, datetime]:
        """
        Processa o período do relatório

        Args:
            start_date: Data inicial (opcional)
            end_date: Data final (opcional)
            period_preset: Preset de período (last_week, last_month, etc)

        Returns:
            Tupla (start_date, end_date) processada
        """
        now = datetime.utcnow()

        # Se fornecido preset, usar ele ao invés de datas customizadas
        if period_preset:
            if period_preset == "last_week":
                start_date = now - timedelta(days=7)
                end_date = now
            elif period_preset == "last_month":
                start_date = now - timedelta(days=30)
                end_date = now
            elif period_preset == "last_quarter":
                start_date = now - timedelta(days=90)
                end_date = now
            elif period_preset == "last_year":
                start_date = now - timedelta(days=365)
                end_date = now

        # Se não fornecido nada, usar último mês como padrão
        if not end_date:
            end_date = now
        if not start_date:
            start_date = end_date - timedelta(days=30)

        return start_date, end_date

    @staticmethod
    def generate_user_efficiency_report(
        db: Session,
        user_id: int,
        current_user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        period_preset: Optional[str] = None,
        project_id: Optional[int] = None
    ) -> dict:
        """
        Gera relatório de eficiência de um usuário

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário a ser analisado
            current_user_id: ID do usuário atual (para verificar permissões)
            start_date: Data inicial do período
            end_date: Data final do período
            period_preset: Preset de período
            project_id: Filtrar por projeto específico (opcional)

        Returns:
            Dicionário com métricas de eficiência do usuário
        """
        # Buscar usuário
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Verificar permissões: usuário pode ver apenas o próprio relatório
        # ou relatórios de projetos onde tem acesso
        if current_user_id != user_id:
            # Permitir se for admin, manager com projetos gerenciados, ou se tiver acesso ao projeto filtrado
            current_user = db.query(User).filter(User.id == current_user_id).first()
            from app.models.user import UserRole

            if current_user.role == UserRole.ADMIN:
                # Admin pode ver qualquer relatório
                pass
            elif current_user.role == UserRole.MANAGER:
                # Manager pode ver relatórios de usuários em projetos que gerencia (owner)
                # Verificar se o user_id está em algum projeto onde current_user é owner
                managed_projects = db.query(Project).filter(Project.owner_id == current_user_id).all()

                # Verificar se o usuário alvo é membro de algum projeto gerenciado
                user_in_managed_project = False
                for proj in managed_projects:
                    target_user = db.query(User).filter(User.id == user_id).first()
                    if target_user in proj.members or proj.owner_id == user_id:
                        user_in_managed_project = True
                        break

                if not user_in_managed_project:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Sem permissão para visualizar este relatório. Manager pode ver apenas relatórios de membros de projetos que gerencia."
                    )
            else:
                # USER comum - só pode ver relatórios de projetos específicos onde tem acesso
                if project_id:
                    if not ProjectService.user_can_access_project(db, project_id, current_user_id):
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sem permissão para visualizar este relatório"
                        )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Sem permissão para visualizar este relatório"
                    )

        # Processar período
        start_date, end_date = ReportService._parse_period(start_date, end_date, period_preset)

        # Buscar tarefas atribuídas ao usuário no período
        query = db.query(Card).join(
            Card.assignees
        ).filter(
            User.id == user_id,
            Card.created_at >= start_date,
            Card.created_at <= end_date,
            Card.status != CardStatus.DELETED
        ).options(
            joinedload(Card.column),
            joinedload(Card.project),
            joinedload(Card.assignees)
        )

        # Filtrar por projeto se especificado
        if project_id:
            query = query.filter(Card.project_id == project_id)

        cards = query.all()

        # Calcular métricas de tarefas
        task_metrics = ReportService._calculate_task_metrics_for_cards(cards, end_date)

        # Calcular métricas de tempo
        time_metrics = ReportService._calculate_time_metrics_for_cards(cards)

        # Distribuição por prioridade
        priority_distribution = ReportService._calculate_priority_distribution(cards)

        # Projetos envolvidos
        projects_involved = ReportService._get_user_projects_in_period(
            db, user_id, start_date, end_date, project_id
        )

        # Atividade total (histórico)
        activity_query = db.query(func.count(CardHistory.id)).filter(
            CardHistory.user_id == user_id,
            CardHistory.created_at >= start_date,
            CardHistory.created_at <= end_date
        )

        if project_id:
            activity_query = activity_query.filter(CardHistory.project_id == project_id)

        total_activity_count = activity_query.scalar() or 0

        return {
            "user_id": user.id,
            "user_name": user.name,
            "user_email": user.email,
            "period_start": start_date,
            "period_end": end_date,
            "task_metrics": task_metrics,
            "time_metrics": time_metrics,
            "priority_distribution": priority_distribution,
            "projects_involved": projects_involved,
            "total_activity_count": total_activity_count
        }

    @staticmethod
    def generate_project_report(
        db: Session,
        project_id: int,
        current_user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        period_preset: Optional[str] = None
    ) -> dict:
        """
        Gera relatório resumido de um projeto

        Args:
            db: Sessão do banco de dados
            project_id: ID do projeto
            current_user_id: ID do usuário atual
            start_date: Data inicial do período
            end_date: Data final do período
            period_preset: Preset de período

        Returns:
            Dicionário com métricas do projeto
        """
        # Verificar permissões
        if not ProjectService.user_can_access_project(db, project_id, current_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este projeto"
            )

        # Buscar projeto
        project = db.query(Project).options(
            joinedload(Project.members)
        ).filter(Project.id == project_id).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )

        # Processar período
        start_date, end_date = ReportService._parse_period(start_date, end_date, period_preset)

        # Buscar todas as tarefas do projeto no período
        cards = db.query(Card).filter(
            Card.project_id == project_id,
            Card.created_at >= start_date,
            Card.created_at <= end_date,
            Card.status != CardStatus.DELETED
        ).all()

        # Métricas de tarefas
        task_metrics = ReportService._calculate_task_metrics_for_cards(cards, end_date)

        # Distribuição por prioridade
        priority_distribution = ReportService._calculate_priority_distribution(cards)

        # Distribuição por coluna
        column_distribution = ReportService._calculate_column_distribution(db, project_id)

        # Top contribuidores
        top_contributors = ReportService._get_top_contributors(
            db, project_id, start_date, end_date
        )

        return {
            "project_id": project.id,
            "project_name": project.name,
            "project_description": project.description or "",
            "period_start": start_date,
            "period_end": end_date,
            "task_metrics": task_metrics,
            "priority_distribution": priority_distribution,
            "column_distribution": column_distribution,
            "total_members": len(project.members) + 1,  # +1 para o owner
            "top_contributors": top_contributors
        }

    @staticmethod
    def generate_team_efficiency_report(
        db: Session,
        project_id: int,
        current_user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        period_preset: Optional[str] = None
    ) -> dict:
        """
        Gera relatório de eficiência da equipe de um projeto

        Args:
            db: Sessão do banco de dados
            project_id: ID do projeto
            current_user_id: ID do usuário atual
            start_date: Data inicial do período
            end_date: Data final do período
            period_preset: Preset de período

        Returns:
            Dicionário com métricas de eficiência da equipe
        """
        # Verificar permissões
        if not ProjectService.user_can_access_project(db, project_id, current_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este projeto"
            )

        # Buscar projeto
        project = db.query(Project).options(
            joinedload(Project.members),
            joinedload(Project.owner)
        ).filter(Project.id == project_id).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )

        # Processar período
        start_date, end_date = ReportService._parse_period(start_date, end_date, period_preset)

        # Buscar todas as tarefas do projeto no período
        cards = db.query(Card).filter(
            Card.project_id == project_id,
            Card.created_at >= start_date,
            Card.created_at <= end_date,
            Card.status != CardStatus.DELETED
        ).all()

        # Métricas gerais da equipe
        team_task_metrics = ReportService._calculate_task_metrics_for_cards(cards, end_date)

        # Obter todos os membros da equipe (owner + members)
        all_members = list(project.members) + [project.owner]
        member_ids = [m.id for m in all_members]

        # Calcular eficiência individual de cada membro
        members_efficiency = []
        for member in all_members:
            # Tarefas atribuídas a este membro no período
            member_cards = db.query(Card).join(
                Card.assignees
            ).filter(
                User.id == member.id,
                Card.project_id == project_id,
                Card.created_at >= start_date,
                Card.created_at <= end_date,
                Card.status != CardStatus.DELETED
            ).all()

            tasks_assigned = len(member_cards)
            tasks_completed = len([c for c in member_cards if c.completed_at])
            efficiency_rate = (tasks_completed / tasks_assigned * 100) if tasks_assigned > 0 else 0.0

            # Atividade no histórico
            activity_count = db.query(func.count(CardHistory.id)).filter(
                CardHistory.user_id == member.id,
                CardHistory.project_id == project_id,
                CardHistory.created_at >= start_date,
                CardHistory.created_at <= end_date
            ).scalar() or 0

            members_efficiency.append({
                "user_id": member.id,
                "user_name": member.name,
                "user_email": member.email,
                "tasks_assigned": tasks_assigned,
                "tasks_completed": tasks_completed,
                "efficiency_rate": round(efficiency_rate, 2),
                "activity_count": activity_count
            })

        # Calcular média de eficiência da equipe
        efficiency_rates = [m["efficiency_rate"] for m in members_efficiency if m["tasks_assigned"] > 0]
        average_efficiency_rate = (
            sum(efficiency_rates) / len(efficiency_rates)
        ) if efficiency_rates else 0.0

        # Encontrar membro mais produtivo (por tarefas concluídas)
        most_productive_member = None
        if members_efficiency:
            most_productive = max(
                members_efficiency,
                key=lambda x: x["tasks_completed"]
            )
            if most_productive["tasks_completed"] > 0:
                most_productive_member = most_productive

        return {
            "project_id": project.id,
            "project_name": project.name,
            "period_start": start_date,
            "period_end": end_date,
            "team_task_metrics": team_task_metrics,
            "members_efficiency": members_efficiency,
            "average_efficiency_rate": round(average_efficiency_rate, 2),
            "most_productive_member": most_productive_member
        }

    # === MÉTODOS AUXILIARES PRIVADOS ===

    @staticmethod
    def _calculate_task_metrics_for_cards(cards: List[Card], reference_date: datetime) -> dict:
        """
        Calcula métricas de tarefas a partir de uma lista de cards

        Args:
            cards: Lista de cards
            reference_date: Data de referência para cálculo de atrasos

        Returns:
            Dicionário com métricas
        """
        total = len(cards)
        completed = len([c for c in cards if c.completed_at])
        pending = total - completed

        # Tarefas atrasadas (due_date passou e não foi concluída)
        def is_overdue(card):
            if not card.due_date or card.completed_at or card.status != CardStatus.ACTIVE:
                return False

            try:
                due_date = card.due_date
                ref_date = reference_date

                # Normalizar timezone
                if due_date.tzinfo is not None and ref_date.tzinfo is None:
                    due_date = due_date.replace(tzinfo=None)
                elif due_date.tzinfo is None and ref_date.tzinfo is not None:
                    ref_date = ref_date.replace(tzinfo=None)

                return due_date < ref_date
            except:
                return False

        overdue = len([c for c in cards if is_overdue(c)])

        completion_rate = (completed / total * 100) if total > 0 else 0.0

        return {
            "total": total,
            "completed": completed,
            "pending": pending,
            "overdue": overdue,
            "completion_rate": round(completion_rate, 2)
        }

    @staticmethod
    def _calculate_time_metrics_for_cards(cards: List[Card]) -> dict:
        """
        Calcula métricas de tempo para uma lista de cards

        Args:
            cards: Lista de cards

        Returns:
            Dicionário com métricas de tempo
        """
        completed_cards = [c for c in cards if c.completed_at and c.created_at]

        # Tempo médio de conclusão
        if completed_cards:
            total_hours = sum([
                (c.completed_at - c.created_at).total_seconds() / 3600
                for c in completed_cards
            ])
            average_completion_time_hours = total_hours / len(completed_cards)
        else:
            average_completion_time_hours = None

        # Cards concluídos no prazo vs atrasados
        completed_on_time = 0
        completed_late = 0

        for card in completed_cards:
            if card.due_date and card.completed_at:
                # Normalizar timezone - converter ambas para aware ou naive
                try:
                    completed_at = card.completed_at
                    due_date = card.due_date

                    # Se uma tem timezone e outra não, converter para naive (sem timezone)
                    if completed_at.tzinfo is not None and due_date.tzinfo is None:
                        completed_at = completed_at.replace(tzinfo=None)
                    elif completed_at.tzinfo is None and due_date.tzinfo is not None:
                        due_date = due_date.replace(tzinfo=None)

                    # Agora podemos comparar
                    if completed_at <= due_date:
                        completed_on_time += 1
                    else:
                        completed_late += 1
                except Exception as e:
                    # Em caso de erro na comparação, ignorar este card
                    continue

        return {
            "average_completion_time_hours": (
                round(average_completion_time_hours, 2)
                if average_completion_time_hours is not None
                else None
            ),
            "completed_on_time": completed_on_time,
            "completed_late": completed_late
        }

    @staticmethod
    def _calculate_priority_distribution(cards: List[Card]) -> dict:
        """
        Calcula distribuição de tarefas por prioridade

        Args:
            cards: Lista de cards

        Returns:
            Dicionário com contagem por prioridade
        """
        distribution = {
            "urgent": 0,
            "high": 0,
            "medium": 0,
            "low": 0
        }

        for card in cards:
            try:
                # card.priority é sempre um enum (nullable=False), mas protegemos contra casos edge
                priority = card.priority.value if hasattr(card.priority, 'value') else str(card.priority)
            except (AttributeError, TypeError):
                priority = "medium"

            if priority in distribution:
                distribution[priority] += 1

        return distribution

    @staticmethod
    def _calculate_column_distribution(db: Session, project_id: int) -> List[dict]:
        """
        Calcula distribuição atual de tarefas por coluna Kanban

        Args:
            db: Sessão do banco de dados
            project_id: ID do projeto

        Returns:
            Lista de dicionários com distribuição por coluna
        """
        results = db.query(
            KanbanColumn.title,
            func.count(Card.id).label('count')
        ).join(
            Card, KanbanColumn.id == Card.column_id
        ).filter(
            Card.project_id == project_id,
            Card.status == CardStatus.ACTIVE
        ).group_by(
            KanbanColumn.title
        ).all()

        return [
            {"column_title": title, "card_count": count}
            for title, count in results
        ]

    @staticmethod
    def _get_top_contributors(
        db: Session,
        project_id: int,
        start_date: datetime,
        end_date: datetime,
        limit: int = 10
    ) -> List[dict]:
        """
        Busca os top N contribuidores do projeto

        Args:
            db: Sessão do banco de dados
            project_id: ID do projeto
            start_date: Data inicial
            end_date: Data final
            limit: Quantidade de contribuidores a retornar

        Returns:
            Lista de dicionários com dados dos contribuidores
        """
        results = db.query(
            User.id,
            User.name,
            User.email,
            func.count(CardHistory.id).label('activity_count')
        ).join(
            CardHistory, User.id == CardHistory.user_id
        ).filter(
            CardHistory.project_id == project_id,
            CardHistory.created_at >= start_date,
            CardHistory.created_at <= end_date
        ).group_by(
            User.id, User.name, User.email
        ).order_by(
            func.count(CardHistory.id).desc()
        ).limit(limit).all()

        contributors = []
        for user_id, name, email, activity_count in results:
            # Buscar tarefas atribuídas e concluídas
            cards = db.query(Card).join(
                Card.assignees
            ).filter(
                User.id == user_id,
                Card.project_id == project_id,
                Card.created_at >= start_date,
                Card.created_at <= end_date,
                Card.status != CardStatus.DELETED
            ).all()

            tasks_assigned = len(cards)
            tasks_completed = len([c for c in cards if c.completed_at])
            efficiency_rate = (
                (tasks_completed / tasks_assigned * 100)
                if tasks_assigned > 0 else 0.0
            )

            contributors.append({
                "user_id": user_id,
                "user_name": name,
                "user_email": email,
                "tasks_assigned": tasks_assigned,
                "tasks_completed": tasks_completed,
                "efficiency_rate": round(efficiency_rate, 2),
                "activity_count": activity_count
            })

        return contributors

    @staticmethod
    def _get_user_projects_in_period(
        db: Session,
        user_id: int,
        start_date: datetime,
        end_date: datetime,
        filter_project_id: Optional[int] = None
    ) -> List[dict]:
        """
        Busca projetos onde o usuário teve atividade no período

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            start_date: Data inicial
            end_date: Data final
            filter_project_id: Filtrar por projeto específico (opcional)

        Returns:
            Lista de dicionários com projetos e quantidade de tarefas
        """
        query = db.query(
            Project.id,
            Project.name,
            func.count(Card.id).label('task_count')
        ).join(
            Card, Project.id == Card.project_id
        ).join(
            Card.assignees
        ).filter(
            User.id == user_id,
            Card.created_at >= start_date,
            Card.created_at <= end_date,
            Card.status != CardStatus.DELETED
        )

        if filter_project_id:
            query = query.filter(Project.id == filter_project_id)

        results = query.group_by(
            Project.id, Project.name
        ).all()

        return [
            {
                "project_id": project_id,
                "project_name": name,
                "task_count": task_count
            }
            for project_id, name, task_count in results
        ]

    # === MÉTODOS DE GERAÇÃO DE PDF ===

    @staticmethod
    def generate_user_efficiency_pdf(
        db: Session,
        user_id: int,
        current_user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        period_preset: Optional[str] = None,
        project_id: Optional[int] = None
    ) -> BytesIO:
        """
        Gera PDF do relatório de eficiência do usuário

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            current_user_id: ID do usuário atual
            start_date: Data inicial
            end_date: Data final
            period_preset: Preset de período
            project_id: ID do projeto (opcional)

        Returns:
            BytesIO com o PDF gerado
        """
        # Obter dados do relatório
        report_data = ReportService.generate_user_efficiency_report(
            db, user_id, current_user_id, start_date, end_date, period_preset, project_id
        )

        # Criar buffer para o PDF
        buffer = BytesIO()

        # Criar documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        elements = []

        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#8B6B47'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#8B6B47'),
            spaceAfter=12,
            spaceBefore=20
        )
        normal_style = styles['Normal']

        # Título
        title = Paragraph(f"Relatório de Eficiência - {report_data['user_name']}", title_style)
        elements.append(title)

        # Informações do período
        start_date_str = report_data['period_start'].strftime('%d/%m/%Y') if report_data['period_start'] else 'N/A'
        end_date_str = report_data['period_end'].strftime('%d/%m/%Y') if report_data['period_end'] else 'N/A'
        period_text = f"<b>Período:</b> {start_date_str} a {end_date_str}"
        elements.append(Paragraph(period_text, normal_style))
        elements.append(Paragraph(f"<b>Email:</b> {report_data['user_email']}", normal_style))
        elements.append(Spacer(1, 20))

        # Métricas de Tarefas
        elements.append(Paragraph("Métricas de Tarefas", heading_style))
        task_data = [
            ['Métrica', 'Valor'],
            ['Total de Tarefas', str(report_data['task_metrics']['total'])],
            ['Tarefas Concluídas', str(report_data['task_metrics']['completed'])],
            ['Tarefas Pendentes', str(report_data['task_metrics']['pending'])],
            ['Tarefas Atrasadas', str(report_data['task_metrics']['overdue'])],
            ['Taxa de Conclusão', f"{report_data['task_metrics']['completion_rate']:.2f}%"]
        ]
        task_table = Table(task_data, colWidths=[3.5*inch, 2*inch])
        task_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B6B47')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(task_table)
        elements.append(Spacer(1, 20))

        # Métricas de Tempo
        if report_data['time_metrics']['average_completion_time_hours'] is not None:
            elements.append(Paragraph("Métricas de Tempo", heading_style))
            time_data = [
                ['Métrica', 'Valor'],
                ['Tempo Médio de Conclusão', f"{report_data['time_metrics']['average_completion_time_hours']:.2f} horas"],
                ['Concluídas no Prazo', str(report_data['time_metrics']['completed_on_time'])],
                ['Concluídas Atrasadas', str(report_data['time_metrics']['completed_late'])]
            ]
            time_table = Table(time_data, colWidths=[3.5*inch, 2*inch])
            time_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B6B47')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(time_table)
            elements.append(Spacer(1, 20))

        # Distribuição por Prioridade
        elements.append(Paragraph("Distribuição por Prioridade", heading_style))
        priority_data = [
            ['Prioridade', 'Quantidade'],
            ['Urgente', str(report_data['priority_distribution']['urgent'])],
            ['Alta', str(report_data['priority_distribution']['high'])],
            ['Média', str(report_data['priority_distribution']['medium'])],
            ['Baixa', str(report_data['priority_distribution']['low'])]
        ]
        priority_table = Table(priority_data, colWidths=[3.5*inch, 2*inch])
        priority_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B6B47')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(priority_table)
        elements.append(Spacer(1, 20))

        # Projetos Envolvidos
        if report_data['projects_involved']:
            elements.append(Paragraph("Projetos Envolvidos", heading_style))
            project_data = [['Projeto', 'Tarefas']]
            for proj in report_data['projects_involved']:
                project_name = proj['project_name'] or 'Sem nome'
                project_data.append([project_name, str(proj['task_count'])])

            project_table = Table(project_data, colWidths=[3.5*inch, 2*inch])
            project_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B6B47')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(project_table)
            elements.append(Spacer(1, 20))

        # Atividade Total
        elements.append(Paragraph(f"<b>Total de Atividades Registradas:</b> {report_data['total_activity_count']}", normal_style))

        # Rodapé
        elements.append(Spacer(1, 30))
        footer_text = f"Relatório gerado em {datetime.utcnow().strftime('%d/%m/%Y às %H:%M:%S')} - Sistema Oriente"
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        elements.append(Paragraph(footer_text, footer_style))

        # Construir PDF
        doc.build(elements)

        # Retornar buffer
        buffer.seek(0)
        return buffer

    @staticmethod
    def generate_project_pdf(
        db: Session,
        project_id: int,
        current_user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        period_preset: Optional[str] = None
    ) -> BytesIO:
        """
        Gera PDF do relatório do projeto

        Args:
            db: Sessão do banco de dados
            project_id: ID do projeto
            current_user_id: ID do usuário atual
            start_date: Data inicial
            end_date: Data final
            period_preset: Preset de período

        Returns:
            BytesIO com o PDF gerado
        """
        # Obter dados do relatório
        report_data = ReportService.generate_project_report(
            db, project_id, current_user_id, start_date, end_date, period_preset
        )

        # Criar buffer para o PDF
        buffer = BytesIO()

        # Criar documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        elements = []

        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#8B6B47'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#8B6B47'),
            spaceAfter=12,
            spaceBefore=20
        )
        normal_style = styles['Normal']

        # Título
        title = Paragraph(f"Relatório do Projeto - {report_data['project_name']}", title_style)
        elements.append(title)

        # Informações do período
        start_date_str = report_data['period_start'].strftime('%d/%m/%Y') if report_data['period_start'] else 'N/A'
        end_date_str = report_data['period_end'].strftime('%d/%m/%Y') if report_data['period_end'] else 'N/A'
        period_text = f"<b>Período:</b> {start_date_str} a {end_date_str}"
        elements.append(Paragraph(period_text, normal_style))
        elements.append(Paragraph(f"<b>Descrição:</b> {report_data['project_description'] or 'N/A'}", normal_style))
        elements.append(Paragraph(f"<b>Total de Membros:</b> {report_data['total_members']}", normal_style))
        elements.append(Spacer(1, 20))

        # Métricas de Tarefas
        elements.append(Paragraph("Métricas Gerais", heading_style))
        task_data = [
            ['Métrica', 'Valor'],
            ['Total de Tarefas', str(report_data['task_metrics']['total'])],
            ['Tarefas Concluídas', str(report_data['task_metrics']['completed'])],
            ['Tarefas Pendentes', str(report_data['task_metrics']['pending'])],
            ['Tarefas Atrasadas', str(report_data['task_metrics']['overdue'])],
            ['Taxa de Conclusão', f"{report_data['task_metrics']['completion_rate']:.2f}%"]
        ]
        task_table = Table(task_data, colWidths=[3.5*inch, 2*inch])
        task_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B6B47')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(task_table)
        elements.append(Spacer(1, 20))

        # Distribuição por Prioridade
        elements.append(Paragraph("Distribuição por Prioridade", heading_style))
        priority_data = [
            ['Prioridade', 'Quantidade'],
            ['Urgente', str(report_data['priority_distribution']['urgent'])],
            ['Alta', str(report_data['priority_distribution']['high'])],
            ['Média', str(report_data['priority_distribution']['medium'])],
            ['Baixa', str(report_data['priority_distribution']['low'])]
        ]
        priority_table = Table(priority_data, colWidths=[3.5*inch, 2*inch])
        priority_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B6B47')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(priority_table)
        elements.append(Spacer(1, 20))

        # Distribuição por Coluna
        if report_data['column_distribution']:
            elements.append(Paragraph("Distribuição por Coluna Kanban", heading_style))
            column_data = [['Coluna', 'Quantidade']]
            for col in report_data['column_distribution']:
                column_data.append([col['column_title'], str(col['card_count'])])

            column_table = Table(column_data, colWidths=[3.5*inch, 2*inch])
            column_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B6B47')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(column_table)
            elements.append(Spacer(1, 20))

        # Top Contribuidores
        if report_data['top_contributors']:
            elements.append(Paragraph("Top Contribuidores", heading_style))
            contrib_data = [['Nome', 'Tarefas', 'Concluídas', 'Eficiência']]
            for contrib in report_data['top_contributors'][:10]:
                contrib_data.append([
                    contrib['user_name'],
                    str(contrib['tasks_assigned']),
                    str(contrib['tasks_completed']),
                    f"{contrib['efficiency_rate']:.1f}%"
                ])

            contrib_table = Table(contrib_data, colWidths=[2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
            contrib_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B6B47')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(contrib_table)

        # Rodapé
        elements.append(Spacer(1, 30))
        footer_text = f"Relatório gerado em {datetime.utcnow().strftime('%d/%m/%Y às %H:%M:%S')} - Sistema Oriente"
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        elements.append(Paragraph(footer_text, footer_style))

        # Construir PDF
        doc.build(elements)

        # Retornar buffer
        buffer.seek(0)
        return buffer

    @staticmethod
    def generate_team_efficiency_pdf(
        db: Session,
        project_id: int,
        current_user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        period_preset: Optional[str] = None
    ) -> BytesIO:
        """
        Gera PDF do relatório de eficiência da equipe

        Args:
            db: Sessão do banco de dados
            project_id: ID do projeto
            current_user_id: ID do usuário atual
            start_date: Data inicial
            end_date: Data final
            period_preset: Preset de período

        Returns:
            BytesIO com o PDF gerado
        """
        # Obter dados do relatório
        report_data = ReportService.generate_team_efficiency_report(
            db, project_id, current_user_id, start_date, end_date, period_preset
        )

        # Criar buffer para o PDF
        buffer = BytesIO()

        # Criar documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        elements = []

        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#8B6B47'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#8B6B47'),
            spaceAfter=12,
            spaceBefore=20
        )
        normal_style = styles['Normal']

        # Título
        title = Paragraph(f"Relatório de Eficiência da Equipe - {report_data['project_name']}", title_style)
        elements.append(title)

        # Informações do período
        start_date_str = report_data['period_start'].strftime('%d/%m/%Y') if report_data['period_start'] else 'N/A'
        end_date_str = report_data['period_end'].strftime('%d/%m/%Y') if report_data['period_end'] else 'N/A'
        period_text = f"<b>Período:</b> {start_date_str} a {end_date_str}"
        elements.append(Paragraph(period_text, normal_style))
        elements.append(Spacer(1, 20))

        # Métricas Gerais da Equipe
        elements.append(Paragraph("Métricas Gerais da Equipe", heading_style))
        team_data = [
            ['Métrica', 'Valor'],
            ['Total de Tarefas', str(report_data['team_task_metrics']['total'])],
            ['Tarefas Concluídas', str(report_data['team_task_metrics']['completed'])],
            ['Tarefas Pendentes', str(report_data['team_task_metrics']['pending'])],
            ['Taxa de Conclusão Média', f"{report_data['average_efficiency_rate']:.2f}%"]
        ]
        team_table = Table(team_data, colWidths=[3.5*inch, 2*inch])
        team_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B6B47')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(team_table)
        elements.append(Spacer(1, 20))

        # Membro Mais Produtivo
        if report_data['most_productive_member']:
            most_prod = report_data['most_productive_member']
            elements.append(Paragraph("Membro Mais Produtivo", heading_style))
            elements.append(Paragraph(
                f"<b>{most_prod['user_name']}</b> - {most_prod['tasks_completed']} tarefas concluídas ({most_prod['efficiency_rate']:.2f}% de eficiência)",
                normal_style
            ))
            elements.append(Spacer(1, 20))

        # Eficiência Individual dos Membros
        if report_data['members_efficiency']:
            elements.append(Paragraph("Eficiência Individual dos Membros", heading_style))
            member_data = [['Nome', 'Atribuídas', 'Concluídas', 'Eficiência', 'Atividades']]
            for member in report_data['members_efficiency']:
                member_data.append([
                    member['user_name'],
                    str(member['tasks_assigned']),
                    str(member['tasks_completed']),
                    f"{member['efficiency_rate']:.1f}%",
                    str(member['activity_count'])
                ])

            member_table = Table(member_data, colWidths=[1.8*inch, 1*inch, 1*inch, 1*inch, 1*inch])
            member_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B6B47')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(member_table)

        # Rodapé
        elements.append(Spacer(1, 30))
        footer_text = f"Relatório gerado em {datetime.utcnow().strftime('%d/%m/%Y às %H:%M:%S')} - Sistema Oriente"
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        elements.append(Paragraph(footer_text, footer_style))

        # Construir PDF
        doc.build(elements)

        # Retornar buffer
        buffer.seek(0)
        return buffer
