# UML Detailed Class Diagram

> **Note**: Este diagrama complementa o `uml-diagram.md` incluindo os métodos existentes nas classes do sistema.
>
> Geração manual - Última atualização: 2025-11-20

```mermaid
classDiagram
    class User {
        +int id
        +str email
        +str hashed_password
        +str name
        +UserRole role
        +UserStatus status
        +datetime created_at
        +datetime updated_at
        +__repr__() str
    }

    class UserService {
        <<service>>
        +get_all_users(skip: int, limit: int)$ UserListResponse
        +get_user_by_id(user_id: int)$ UserResponse
        +update_user(user_id: int, user_data: UserUpdateRequest, current_user_id: int, current_user_role: str)$ UserResponse
        +change_password(user_id: int, password_data: PasswordChangeRequest, current_user_id: int)$ bool
        +deactivate_user(user_id: int, current_user_id: int, current_user_role: str)$ UserResponse
        +activate_user(user_id: int, current_user_role: str)$ UserResponse
        +update_user_role(user_id: int, new_role: str, current_user_id: int, current_user_role: str)$ UserResponse
    }

    class Team {
        +int id
        +str name
        +str description
        +int leader_id
        +TeamStatus status
        +datetime created_at
        +datetime updated_at
        +__repr__() str
    }

    class TeamService {
        <<service>>
        +create_team(team_data: TeamCreateRequest, current_user_id: int)$ Team
        +get_all_teams(current_user_id: int)$ List[Team]
        +get_team_by_id(team_id: int, current_user_id: int)$ Team
        +update_team(team_id: int, team_data: TeamUpdateRequest, current_user_id: int)$ Team
        +delete_team(team_id: int, current_user_id: int)$ bool
        +add_members(team_id: int, member_request: TeamMemberRequest, current_user_id: int)$ AddMembersResponse
        +remove_member(team_id: int, user_id: int, current_user_id: int)$ bool
        +get_team_stats(team_id: int, current_user_id: int)$ dict
        -_add_members_to_team(team: Team, member_ids: List[int])$ None
    }

    class Project {
        +int id
        +str name
        +str description
        +int team_id
        +datetime created_at
        +datetime updated_at
        +update_timestamp() None
        +__repr__() str
    }

    class ProjectService {
        <<service>>
        +create_project(request: ProjectCreateRequest, owner: User)$ Project
        +find_by_id(project_id: int)$ Project
        +find_projects_by_user(user: User)$ List[ProjectSummary]
        +update_project(project_id: int, request: ProjectUpdateRequest, current_user: User)$ Project
        +delete_project(project_id: int, current_user: User)$ None
        +user_can_access_project(project_id: int, user_id: int)$ bool
        +user_can_edit_project(project_id: int, user_id: int)$ bool
        +convert_to_project_response(project: Project)$ ProjectResponse
        -_convert_to_project_summary(project: Project)$ ProjectSummary
        -_find_users_by_names(names: List[str])$ List[User]
    }

    class KanbanColumn {
        +int id
        +str name
        +int project_id
        +int position
        +datetime created_at
        +datetime updated_at
        +__repr__() str
    }

    class ColumnService {
        <<service>>
        +create_column(project_id: int, column_data: ColumnCreate, current_user_id: int)$ ColumnResponse
        +get_project_columns(project_id: int, current_user_id: int)$ List[ColumnResponse]
        +get_column_by_id(column_id: int, current_user_id: int)$ ColumnResponse
        +update_column(column_id: int, column_data: ColumnUpdate, current_user_id: int)$ ColumnResponse
        +delete_column(column_id: int, current_user_id: int)$ None
        +move_column(column_id: int, move_data: ColumnMove, current_user_id: int)$ ColumnResponse
        +create_default_columns(project_id: int)$ None
    }

    class Card {
        +int id
        +str title
        +str description
        +int column_id
        +int assigned_user_id
        +CardPriority priority
        +CardStatus status
        +date due_date
        +int position
        +datetime created_at
        +datetime updated_at
        +__repr__() str
    }

    class CardService {
        <<service>>
        +create_card(project_id: int, card_data: CardCreate, current_user_id: int)$ CardResponse
        +get_project_cards(project_id: int, current_user_id: int, filters: CardFilters)$ List[CardResponse]
        +get_card_by_id(card_id: int, current_user_id: int)$ CardResponse
        +update_card(card_id: int, card_data: CardUpdate, current_user_id: int)$ CardResponse
        +delete_card(card_id: int, current_user_id: int)$ None
        +move_card(card_id: int, move_data: CardMove, current_user_id: int)$ CardResponse
        +update_card_status(card_id: int, status_data: CardStatusUpdate, current_user_id: int)$ CardResponse
        +create_tag(project_id: int, tag_data: TagCreate, current_user_id: int)$ TagResponse
        +get_project_tags(project_id: int, current_user_id: int)$ List[TagResponse]
    }

    class Tag {
        +int id
        +str name
        +str color
        +int project_id
        +datetime created_at
        +__repr__() str
    }

    class Comment {
        +int id
        +str content
        +int card_id
        +int user_id
        +datetime created_at
        +datetime updated_at
        +bool is_deleted
        +__repr__() str
    }

    class CommentService {
        <<service>>
        +EDIT_TIME_LIMIT_MINUTES = 2
        +create_comment(project_id: int, card_id: int, comment_data: CommentCreate, current_user_id: int)$ Comment
        +get_comments_by_card(project_id: int, card_id: int, current_user_id: int)$ List[CommentResponse]
        +update_comment(project_id: int, card_id: int, comment_id: int, comment_data: CommentUpdate, current_user_id: int)$ Comment
        +delete_comment(project_id: int, card_id: int, comment_id: int, current_user_id: int)$ None
        -_can_modify_comment(comment: Comment, user_id: int, user_role: str)$ bool
    }

    class CommentMention {
        +int id
        +int comment_id
        +int mentioned_user_id
        +datetime created_at
        +__repr__() str
    }

    class CommentAudit {
        +int id
        +int comment_id
        +str content
        +int deleted_by_user_id
        +datetime deleted_at
        +__repr__() str
    }

    class Attachment {
        +int id
        +str filename
        +str file_path
        +str file_type
        +int file_size
        +int card_id
        +int uploaded_by_user_id
        +datetime uploaded_at
        +__repr__() str
    }

    class AttachmentService {
        <<service>>
        +upload_attachment(card_id: int, project_id: int, file: UploadFile, user_id: int)$ Attachment
        +get_card_attachments(card_id: int, project_id: int, user_id: int)$ List[Attachment]
        +get_attachment(attachment_id: int, card_id: int, project_id: int, user_id: int)$ Attachment
        +delete_attachment(attachment_id: int, card_id: int, project_id: int, user_id: int)$ None
        +get_project_storage_info(project_id: int, user_id: int)$ dict
    }

    class CardHistory {
        +int id
        +int card_id
        +int user_id
        +CardHistoryAction action
        +str field_name
        +str old_value
        +str new_value
        +datetime created_at
        +__repr__() str
    }

    class CardHistoryService {
        <<service>>
        +get_card_history(card_id: int, current_user_id: int)$ List[CardHistory]
        +create_history_entry(card_id: int, user_id: int, action: CardHistoryAction, field_name: str, old_value: str, new_value: str)$ CardHistory
    }

    class Notification {
        +int id
        +int user_id
        +NotificationType type
        +str title
        +str message
        +bool is_read
        +int related_card_id
        +int related_project_id
        +datetime created_at
        +__repr__() str
    }

    class NotificationService {
        <<service>>
        +create_notification(notification_data: NotificationCreateRequest, current_user_id: int)$ Notification
        +get_user_notifications(user_id: int, unread_only: bool, notification_type: NotificationType, limit: int)$ List[Notification]
        +get_notification_by_id(notification_id: int, current_user_id: int)$ Notification
        +mark_as_read(notification_id: int, current_user_id: int)$ Notification
        +mark_multiple_as_read(request: NotificationMarkReadRequest, current_user_id: int)$ int
        +mark_all_as_read(current_user_id: int)$ int
        +delete_notification(notification_id: int, current_user_id: int)$ None
        +get_unread_count(user_id: int)$ int
        +get_notification_stats(user_id: int)$ NotificationStatsResponse
        +delete_all_read_notifications(user_id: int)$ int
    }

    class Chat {
        +int id
        +str name
        +ChatType type
        +datetime created_at
        +datetime updated_at
        +__repr__() str
        +is_individual bool
        +is_group bool
        +participant_count int
        +get_participant_ids() List[int]
        +has_participant(user_id: int) bool
        +get_chat_name_for_user(user_id: int) str
    }

    class ChatService {
        <<service>>
        +create_individual_chat(user_id: int, other_user_id: int)$ Chat
        +create_group_chat(chat_data: ChatCreate, creator_id: int)$ Chat
        +get_user_chats(user_id: int)$ List[ChatResponse]
        +get_chat_by_id(chat_id: int, user_id: int)$ ChatDetailResponse
        +add_participant(chat_id: int, new_user_id: int, requester_id: int)$ Chat
        +remove_participant(chat_id: int, user_to_remove_id: int, requester_id: int)$ Chat
        +update_last_read(chat_id: int, user_id: int)$ None
        +update_group_name(chat_id: int, new_name: str, user_id: int)$ Chat
        -_can_access_chat(chat_id: int, user_id: int)$ bool
        -_calculate_unread_count(chat_id: int, user_id: int)$ int
        -_get_last_message(chat_id: int)$ ChatLastMessage
    }

    class ChatMessage {
        +int id
        +int chat_id
        +int sender_id
        +str content
        +datetime sent_at
        +bool is_read
        +__repr__() str
    }

    class ChatMessageService {
        <<service>>
        +EDIT_TIME_LIMIT_MINUTES = 10
        +send_message(chat_id: int, message_data: ChatMessageCreate, sender_id: int)$ ChatMessageResponse
        +get_chat_messages(chat_id: int, user_id: int, limit: int, offset: int)$ ChatMessageListResponse
        +edit_message(message_id: int, message_data: ChatMessageUpdate, user_id: int)$ ChatMessageResponse
        +delete_message(message_id: int, user_id: int)$ None
        -_can_modify_message(message: ChatMessage, user_id: int)$ bool
        -_create_message_notifications(message: ChatMessage, chat: Chat)$ None
    }

    class ChatHelpers {
        <<utility>>
        +generate_individual_chat_name(user1_name: str, user2_name: str)$ str
        +is_valid_group_name(name: str)$ bool
        +format_participant_list(participants: List)$ str
    }

    class AuthService {
        <<service>>
        +register_user(user_data: UserCreateRequest)$ User
        +authenticate_user(email: str, password: str)$ User
        +create_access_token(data: dict)$ str
    }

    class ReportService {
        <<service>>
        +generate_user_efficiency_report(user_id: int, current_user_id: int, start_date: datetime, end_date: datetime, period_preset: str, project_id: int)$ dict
        +generate_project_report(project_id: int, current_user_id: int, start_date: datetime, end_date: datetime, period_preset: str)$ dict
        +generate_team_efficiency_report(project_id: int, current_user_id: int, start_date: datetime, end_date: datetime, period_preset: str)$ dict
        +generate_user_efficiency_pdf(user_id: int, current_user_id: int, start_date: datetime, end_date: datetime, period_preset: str, project_id: int)$ BytesIO
        +generate_project_pdf(project_id: int, current_user_id: int, start_date: datetime, end_date: datetime, period_preset: str)$ BytesIO
        +generate_team_efficiency_pdf(project_id: int, current_user_id: int, start_date: datetime, end_date: datetime, period_preset: str)$ BytesIO
        -_parse_period(start_date: datetime, end_date: datetime, period_preset: str)$ Tuple[datetime, datetime]
        -_calculate_task_metrics_for_cards(cards: List, reference_date: datetime)$ dict
        -_calculate_time_metrics_for_cards(cards: List)$ dict
        -_calculate_priority_distribution(cards: List)$ dict
        -_calculate_column_distribution(project_id: int)$ List[dict]
        -_get_top_contributors(project_id: int, start_date: datetime, end_date: datetime, limit: int)$ List[dict]
        -_get_user_projects_in_period(user_id: int, start_date: datetime, end_date: datetime, filter_project_id: int)$ List[dict]
    }

    class CloudinaryService {
        <<service>>
        +upload_file(file: UploadFile, folder: str)$ dict
        +delete_file(public_id: str)$ bool
        +get_file_url(public_id: str)$ str
    }

    %% Relationships
    User "1" --> "*" Team : leads
    Team "1" --> "*" Project : has
    User "*" --> "*" Team : members
    Project "1" --> "*" KanbanColumn : has
    KanbanColumn "1" --> "*" Card : contains
    User "1" --> "*" Card : assigned
    Card "*" --> "*" Tag : tagged
    Project "1" --> "*" Tag : has
    Card "1" --> "*" Comment : has
    User "1" --> "*" Comment : writes
    Comment "1" --> "*" CommentMention : has
    User "1" --> "*" CommentMention : mentioned
    Comment "1" --> "0..1" CommentAudit : audited
    User "1" --> "*" CommentAudit : deleted_by
    Card "1" --> "*" Attachment : has
    User "1" --> "*" Attachment : uploads
    Card "1" --> "*" CardHistory : history
    User "1" --> "*" CardHistory : performed
    User "1" --> "*" Notification : receives
    Card "0..1" --> "*" Notification : triggers
    Project "0..1" --> "*" Notification : triggers
    Chat "1" --> "*" ChatMessage : contains
    User "1" --> "*" ChatMessage : sends
    User "*" --> "*" Chat : participates
```

## Enums

```mermaid
classDiagram
    class UserRole {
        <<enumeration>>
        ADMIN
        USER
    }

    class UserStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
    }

    class CardPriority {
        <<enumeration>>
        LOW
        MEDIUM
        HIGH
        URGENT
    }

    class CardStatus {
        <<enumeration>>
        TODO
        IN_PROGRESS
        DONE
    }

    class TeamStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
    }

    class ChatType {
        <<enumeration>>
        INDIVIDUAL
        GROUP
    }

    class NotificationType {
        <<enumeration>>
        CARD_ASSIGNED
        CARD_COMMENTED
        CARD_UPDATED
        MENTION
        DEADLINE_APPROACHING
        PROJECT_UPDATED
    }

    class CardHistoryAction {
        <<enumeration>>
        CREATED
        UPDATED
        MOVED
        ASSIGNED
        COMPLETED
        DELETED
    }
```

## Notas sobre os Métodos

### Métodos Padrão (`__repr__`)
Todas as classes de entidade possuem o método `__repr__()` que retorna uma representação em string da instância para debugging.

### Classes de Serviço (Services)
As classes marcadas com `<<service>>` implementam a lógica de negócio e operações CRUD do sistema:

#### UserService
CRUD completo de usuários com operações especiais:
- Gerenciamento de roles (ADMIN/USER)
- Ativação/desativação de contas
- Alteração de senha com validações

#### TeamService
Gerenciamento de equipes:
- CRUD completo de teams
- Adição/remoção de membros
- Estatísticas de equipe

#### ProjectService
Gerenciamento de projetos:
- CRUD completo
- Controle de acesso (leitura/edição)
- Conversão para diferentes formatos de resposta

#### ColumnService
Gerenciamento de colunas Kanban:
- CRUD completo
- Reordenação de colunas
- Criação automática de colunas padrão

#### CardService
Gerenciamento de cards e tags:
- CRUD completo de cards
- Movimentação entre colunas
- Filtros avançados
- Gerenciamento de tags

#### CommentService
Gerenciamento de comentários:
- CRUD completo
- **Limite de edição: 2 minutos** (apenas autor pode editar/deletar)
- ADMIN pode sempre modificar

#### NotificationService
Sistema de notificações:
- CRUD completo
- Marcação individual/múltipla/todas como lidas
- Contagem de não lidas
- Estatísticas
- Limpeza de notificações lidas

#### AttachmentService
Gerenciamento de anexos:
- Upload/download de arquivos
- Integração com Cloudinary
- Informações de armazenamento por projeto

#### CardHistoryService
Rastreamento de mudanças:
- Registro automático de alterações em cards
- Histórico completo de ações

#### ChatService
Gerenciamento de chats:
- Criação de chats individuais e em grupo
- Adição/remoção de participantes
- Atualização de nome de grupo
- Marcação de leitura
- Cálculo de mensagens não lidas

#### ChatMessageService
Gerenciamento de mensagens:
- Envio/edição/exclusão de mensagens
- **Limite de edição: 10 minutos**
- Criação automática de notificações

#### AuthService
Autenticação e autorização:
- Registro de novos usuários
- Autenticação por email/senha
- Geração de tokens JWT

#### ReportService
Geração de relatórios e PDFs:
- Relatório de eficiência por usuário
- Relatório de projeto
- Relatório de eficiência de equipe
- Exportação em PDF de todos os relatórios
- Métricas de tarefas, tempo e prioridades

#### CloudinaryService
Gerenciamento de arquivos na nuvem:
- Upload de arquivos
- Exclusão de arquivos
- Geração de URLs públicas

### Classe Chat - Métodos de Negócio
A classe `Chat` possui a implementação mais rica de métodos em entidades:

- **Properties** (`is_individual`, `is_group`, `participant_count`): Fornecem informações computadas sobre o tipo e estado do chat
- **Métodos de consulta** (`get_participant_ids()`, `has_participant()`): Permitem verificar participantes
- **Métodos de formatação** (`get_chat_name_for_user()`): Retorna o nome apropriado do chat para cada usuário

### Classe Project
- `update_timestamp()`: Atualiza manualmente o campo `updated_at` (útil quando apenas relacionamentos mudam)

### Classe ChatHelpers (Utilitária)
Métodos estáticos para operações auxiliares relacionadas a chats:
- Geração de nomes para chats individuais
- Validação de nomes de grupos
- Formatação de listas de participantes

## Convenções de Nomenclatura

### Métodos Públicos vs Privados
- **Métodos públicos** (`+`): Interface pública do serviço, usada pelos controllers/routers
- **Métodos privados** (`-` com prefixo `_`): Lógica interna, helpers, não devem ser chamados externamente

### Métodos Estáticos
- Marcados com `$` após os parâmetros
- Não dependem de instância da classe
- Geralmente utilities ou helpers

### Constantes
- Definidas em UPPER_CASE
- Exemplo: `EDIT_TIME_LIMIT_MINUTES`

## Endpoints REST API

Cada Service possui endpoints correspondentes nos routers (`app/routers/`):

- **UserRouter**: `/api/users`
- **TeamRouter**: `/api/teams`
- **ProjectRouter**: `/api/projects`
- **ColumnRouter**: `/api/projects/{project_id}/columns`
- **CardRouter**: `/api/projects/{project_id}/cards`
- **CommentRouter**: `/api/projects/{project_id}/cards/{card_id}/comments`
- **NotificationRouter**: `/api/notifications`
- **AttachmentRouter**: `/api/projects/{project_id}/cards/{card_id}/attachments`
- **ChatRouter**: `/api/chats`
- **AuthRouter**: `/api/auth`
- **ReportRouter**: `/api/reports`
