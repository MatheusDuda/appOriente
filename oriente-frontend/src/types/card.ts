// Tipos para Card
export interface Card {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: "High" | "Medium" | "Low";
    project_id: number;
    column_id: string;
    created_at: string;
    updated_at: string;
    due_date?: string;
    assignees?: CardAssignee[];
    tags?: CardTag[];
}

export interface CardAssignee {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

export interface CardTag {
    id: number;
    name: string;
    color: string;
}

// Tipos para Comentários
export interface CommentAuthor {
    id: number;
    name: string;
    email: string;
}

export interface Comment {
    id: number;
    content: string;
    card_id: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    user: CommentAuthor;
    can_edit: boolean;
    can_delete: boolean;
}

export interface CommentCreate {
    content: string;
}

export interface CommentUpdate {
    content: string;
}

// Tipos para Histórico de Auditoria
export enum CardHistoryAction {
    CREATED = "CREATED",
    UPDATED = "UPDATED",
    MOVED = "MOVED",
    COMMENT_ADDED = "COMMENT_ADDED",
    COMMENT_DELETED = "COMMENT_DELETED",
    ASSIGNEE_ADDED = "ASSIGNEE_ADDED",
    ASSIGNEE_REMOVED = "ASSIGNEE_REMOVED",
    TAG_ADDED = "TAG_ADDED",
    TAG_REMOVED = "TAG_REMOVED",
}

export interface CardHistoryUser {
    id: number;
    name: string;
    email: string;
}

export interface CardHistory {
    id: number;
    action: CardHistoryAction;
    card_id: string;
    project_id: number;
    message: string;
    details?: Record<string, any>;
    created_at: string;
    user: CardHistoryUser;
}

export interface CardHistoryListResponse {
    history: CardHistory[];
    total: number;
    page: number;
    size: number;
    total_pages: number;
}
