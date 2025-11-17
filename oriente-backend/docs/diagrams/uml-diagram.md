# Diagrama UML - Classes

*Gerado automaticamente em: 2025-11-17 06:59:51*

```mermaid
classDiagram
    class Attachment {
        +int id
        +str filename
        +str file_path
        +int file_size
        +str mime_type
        +int card_id
        +int uploaded_by_id
        +datetime created_at
    }

    class Card {
        +int id
        +str title
        +str description
        +int position
        +str priority
        +str status
        +datetime due_date
        +datetime completed_at
        +int column_id
        +int project_id
        +int created_by_id
        +datetime created_at
        +datetime updated_at
    }

    class CardHistory {
        +int id
        +str action
        +int card_id
        +int project_id
        +int user_id
        +str message
        +JSON details
        +datetime created_at
    }

    class Chat {
        +int id
        +str type
        +str name
        +datetime created_at
        +datetime updated_at
    }

    class ChatMessage {
        +int id
        +str content
        +int chat_id
        +int sender_id
        +bool is_edited
        +datetime edited_at
        +datetime created_at
        +datetime updated_at
    }

    class Comment {
        +int id
        +str content
        +int card_id
        +int user_id
        +datetime created_at
        +datetime updated_at
    }

    class CommentAudit {
        +int id
        +int comment_id
        +str content
        +int original_author_id
        +int deleted_by_id
        +datetime deleted_at
    }

    class CommentMention {
        +int id
        +int comment_id
        +int mentioned_user_id
        +datetime created_at
    }

    class KanbanColumn {
        +int id
        +str title
        +str description
        +int position
        +str color
        +int project_id
        +datetime created_at
        +datetime updated_at
    }

    class Notification {
        +int id
        +str type
        +str title
        +str message
        +bool is_read
        +datetime created_at
        +int recipient_user_id
        +str related_entity_type
        +int related_entity_id
        +str action_url
    }

    class Project {
        +int id
        +str name
        +str description
        +int owner_id
        +int team_id
        +datetime created_at
        +datetime updated_at
    }

    class Tag {
        +int id
        +str name
        +str color
        +int project_id
        +datetime created_at
    }

    class Team {
        +int id
        +str name
        +str description
        +str status
        +int leader_id
        +datetime created_at
        +datetime updated_at
    }

    class User {
        +int id
        +str name
        +str email
        +str password_hash
        +str status
        +str role
        +datetime created_at
        +datetime updated_at
    }

    CardHistory "*" -- "1" Card : card
    CardHistory "*" -- "1" Project : project
    CardHistory "*" -- "1" User : user
    Card "*" -- "1" KanbanColumn : column
    Card "*" -- "1" Project : project
    Card "*" -- "1" User : created_by
    Card "*" -- "*" User : assignees
    Card "*" -- "*" Tag : tags
    Card "1" -- "*" Comment : comments
    Card "1" -- "*" CardHistory : history
    Card "1" -- "*" Attachment : attachments
    CommentMention "*" -- "1" Comment : comment
    CommentMention "*" -- "1" User : mentioned_user
    KanbanColumn "*" -- "1" Project : project
    KanbanColumn "1" -- "*" Card : cards
    Tag "*" -- "1" Project : project
    Tag "*" -- "*" Card : cards
    Team "*" -- "1" User : leader
    Team "*" -- "*" User : members
    Team "1" -- "*" Project : projects
    CommentAudit "*" -- "1" User : original_author
    CommentAudit "*" -- "1" User : deleted_by
    Chat "*" -- "*" User : participants
    Chat "1" -- "*" ChatMessage : messages
    Attachment "*" -- "1" Card : card
    Attachment "*" -- "1" User : uploaded_by
    Notification "*" -- "1" User : recipient
    ChatMessage "*" -- "1" Chat : chat
    ChatMessage "*" -- "1" User : sender
    User "1" -- "*" Project : owned_projects
    User "*" -- "*" Project : member_projects
    User "*" -- "*" Card : assigned_cards
    User "1" -- "*" Team : led_teams
    User "*" -- "*" Team : member_teams
    User "1" -- "*" Comment : comments
    User "*" -- "*" Chat : chats
    User "1" -- "*" ChatMessage : chat_messages
    Comment "*" -- "1" Card : card
    Comment "*" -- "1" User : user
    Comment "1" -- "*" CommentMention : mentions
    Project "*" -- "1" User : owner
    Project "*" -- "1" Team : team
    Project "*" -- "*" User : members
    Project "1" -- "*" KanbanColumn : columns
    Project "1" -- "*" Card : cards
    Project "1" -- "*" Tag : tags
```

## Legenda

- `1 -- *`: Relacionamento um para muitos
- `* -- *`: Relacionamento muitos para muitos
- `+`: Atributo público
