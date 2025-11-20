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

    class KanbanColumn {
        +int id
        +str name
        +int project_id
        +int position
        +datetime created_at
        +datetime updated_at
        +__repr__() str
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

    class ChatMessage {
        +int id
        +int chat_id
        +int sender_id
        +str content
        +datetime sent_at
        +bool is_read
        +__repr__() str
    }

    class ChatHelpers {
        <<utility>>
        +generate_individual_chat_name(user1_name: str, user2_name: str)$ str
        +is_valid_group_name(name: str)$ bool
        +format_participant_list(participants: List)$ str
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
Todas as classes possuem o método `__repr__()` que retorna uma representação em string da instância para debugging.

### Classe Chat - Métodos de Negócio
A classe `Chat` possui a implementação mais rica de métodos:

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
