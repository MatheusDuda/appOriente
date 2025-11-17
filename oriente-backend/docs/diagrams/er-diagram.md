# Diagrama ER - Entidade-Relacionamento

*Gerado automaticamente em: 2025-11-17 06:59:51*

```mermaid
erDiagram
    Attachment {
        int id PK
        str filename NOT NULL
        str file_path NOT NULL
        int file_size NOT NULL
        str mime_type NOT NULL
        int card_id FK NOT NULL
        int uploaded_by_id FK
        datetime created_at
    }

    Card {
        int id PK
        str title NOT NULL
        str description
        int position NOT NULL
        str priority NOT NULL
        str status NOT NULL
        datetime due_date
        datetime completed_at
        int column_id FK NOT NULL
        int project_id FK NOT NULL
        int created_by_id FK
        datetime created_at
        datetime updated_at
    }

    CardHistory {
        int id PK
        str action NOT NULL
        int card_id FK NOT NULL
        int project_id FK NOT NULL
        int user_id FK
        str message NOT NULL
        JSON details
        datetime created_at NOT NULL
    }

    Chat {
        int id PK
        str type NOT NULL
        str name
        datetime created_at
        datetime updated_at
    }

    ChatMessage {
        int id PK
        str content NOT NULL
        int chat_id FK NOT NULL
        int sender_id FK
        bool is_edited NOT NULL
        datetime edited_at
        datetime created_at NOT NULL
        datetime updated_at NOT NULL
    }

    Comment {
        int id PK
        str content NOT NULL
        int card_id FK NOT NULL
        int user_id FK
        datetime created_at NOT NULL
        datetime updated_at NOT NULL
    }

    CommentAudit {
        int id PK
        int comment_id NOT NULL
        str content NOT NULL
        int original_author_id FK
        int deleted_by_id FK
        datetime deleted_at NOT NULL
    }

    CommentMention {
        int id PK
        int comment_id FK NOT NULL
        int mentioned_user_id FK NOT NULL
        datetime created_at NOT NULL
    }

    KanbanColumn {
        int id PK
        str title NOT NULL
        str description
        int position NOT NULL
        str color
        int project_id FK NOT NULL
        datetime created_at
        datetime updated_at
    }

    Notification {
        int id PK
        str type NOT NULL
        str title NOT NULL
        str message NOT NULL
        bool is_read NOT NULL
        datetime created_at NOT NULL
        int recipient_user_id FK NOT NULL
        str related_entity_type
        int related_entity_id
        str action_url
    }

    Project {
        int id PK
        str name NOT NULL
        str description
        int owner_id FK NOT NULL
        int team_id FK NOT NULL
        datetime created_at NOT NULL
        datetime updated_at NOT NULL
    }

    Tag {
        int id PK
        str name NOT NULL
        str color NOT NULL
        int project_id FK NOT NULL
        datetime created_at
    }

    Team {
        int id PK
        str name NOT NULL
        str description
        str status NOT NULL
        int leader_id FK
        datetime created_at
        datetime updated_at
    }

    User {
        int id PK
        str name NOT NULL
        str email NOT NULL
        str password_hash NOT NULL
        str status NOT NULL
        str role NOT NULL
        datetime created_at NOT NULL
        datetime updated_at NOT NULL
    }

    CardHistory }o--|| Card : "card"
    CardHistory }o--|| Project : "project"
    CardHistory }o--|| User : "user"
    Card }o--|| KanbanColumn : "column"
    Card }o--|| Project : "project"
    Card }o--|| User : "created_by"
    Card }o--o{ User : "assignees"
    Card }o--o{ Tag : "tags"
    Card ||--o{ Comment : "comments"
    Card ||--o{ CardHistory : "history"
    Card ||--o{ Attachment : "attachments"
    CommentMention }o--|| Comment : "comment"
    CommentMention }o--|| User : "mentioned_user"
    KanbanColumn }o--|| Project : "project"
    KanbanColumn ||--o{ Card : "cards"
    Tag }o--|| Project : "project"
    Tag }o--o{ Card : "cards"
    Team }o--|| User : "leader"
    Team }o--o{ User : "members"
    Team ||--o{ Project : "projects"
    CommentAudit }o--|| User : "original_author"
    CommentAudit }o--|| User : "deleted_by"
    Chat }o--o{ User : "participants"
    Chat ||--o{ ChatMessage : "messages"
    Attachment }o--|| Card : "card"
    Attachment }o--|| User : "uploaded_by"
    Notification }o--|| User : "recipient"
    ChatMessage }o--|| Chat : "chat"
    ChatMessage }o--|| User : "sender"
    User ||--o{ Project : "owned_projects"
    User }o--o{ Project : "member_projects"
    User }o--o{ Card : "assigned_cards"
    User ||--o{ Team : "led_teams"
    User }o--o{ Team : "member_teams"
    User ||--o{ Comment : "comments"
    User }o--o{ Chat : "chats"
    User ||--o{ ChatMessage : "chat_messages"
    Comment }o--|| Card : "card"
    Comment }o--|| User : "user"
    Comment ||--o{ CommentMention : "mentions"
    Project }o--|| User : "owner"
    Project }o--|| Team : "team"
    Project }o--o{ User : "members"
    Project ||--o{ KanbanColumn : "columns"
    Project ||--o{ Card : "cards"
    Project ||--o{ Tag : "tags"
```

## Legenda

- **PK**: Primary Key (Chave Primária)
- **FK**: Foreign Key (Chave Estrangeira)
- **NOT NULL**: Campo obrigatório
- `||--o{`: Um para muitos (One-to-Many)
- `}o--||`: Muitos para um (Many-to-One)
- `}o--o{`: Muitos para muitos (Many-to-Many)
