// ========================================
// ENUMS
// ========================================

export enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
    MANAGER = "MANAGER",
}

export enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}

export enum TeamStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

export enum CardPriority {
    URGENT = "urgent",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
}

// ========================================
// USER TYPES
// ========================================

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    created_at: string;
    updated_at: string;
    teams?: TeamListItem[];
}

export interface UserUpdateRequest {
    name: string;
    email: string;
}

export interface UserChangePasswordRequest {
    old_password: string;
    new_password: string;
}

export interface UserListResponse {
    users: User[];
    total: number;
    page: number;
    size: number;
    total_pages: number;
}

// ========================================
// TEAM TYPES
// ========================================

export interface TeamMember {
    id: number;
    name: string;
    email: string;
    role?: UserRole;
}

export interface TeamLeader {
    id: number;
    name: string;
    email: string;
}

export interface Team {
    id: number;
    name: string;
    description: string;
    status: TeamStatus;
    leader_id: number;
    created_at: string;
    updated_at: string;
    leader: TeamLeader;
    members: TeamMember[];
    projects_count: number;
}

export interface TeamListItem {
    id: number;
    name: string;
    description: string;
    status: TeamStatus;
    leader: TeamLeader;
    members: TeamMember[];
    projects_count: number;
}

export interface TeamProject {
    id: number;
    name: string;
    description: string;
    owner_name: string;
    created_at: string;
}

export interface TeamDetailed extends Team {
    projects: TeamProject[];
}

export interface TeamCreateRequest {
    name: string;
    description: string;
    leader_id: number;
    status: TeamStatus;
    member_ids: number[];
}

export interface TeamUpdateRequest {
    name?: string;
    description?: string;
    leader_id?: number;
    status?: TeamStatus;
}

export interface AddMembersRequest {
    user_ids: number[];
}

export interface AddMembersResponse {
    message: string;
    added_members: TeamMember[];
    already_members: string[];
    not_found: string[];
}

export interface TeamStats {
    team_id: number;
    team_name: string;
    total_members: number;
    total_projects: number;
    active_projects: number;
    completed_tasks: number;
    pending_tasks: number;
}

// ========================================
// PROJECT TYPES
// ========================================

export interface Project {
    id: number;
    name: string;
    description: string;
    owner_email: string;
    team_id: number;
    member_names: string[];
    created_at: string;
    updated_at: string;
}

export interface ProjectSummary {
    id: number;
    name: string;
    description: string;
    owner_email: string;
    member_count: number;
    created_at: string;
    updated_at: string;
}

export interface ProjectCreateRequest {
    name: string;
    description: string;
    team_id: number;
    member_names: string[];
}

export interface ProjectUpdateRequest {
    name?: string;
    description?: string;
    member_names?: string[];
}

// ========================================
// KANBAN COLUMN TYPES
// ========================================

export interface KanbanColumn {
    id: number;
    title: string;
    color: string;
    position: number;
    project_id: number;
    cards: Card[];
}

export interface ColumnCreateRequest {
    title: string;
    color?: string;
    position?: number;
}

export interface ColumnUpdateRequest {
    title?: string;
    description?: string;
    color?: string;
}

export interface ColumnMoveRequest {
    new_position: number;
}

// ========================================
// COMMENT TYPES
// ========================================

export interface CommentAuthor {
    id: number;
    name: string;
    email: string;
}

export interface CommentAttachment {
    id: number;
    filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    comment_id: number;
    uploaded_by_id: number | null;
    created_at: string;
    uploaded_by?: AttachmentUploader;
}

export interface CommentAttachmentListResponse {
    attachments: CommentAttachment[];
    total: number;
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
    attachments?: CommentAttachment[];
}

export interface CommentCreate {
    content: string;
}

export interface CommentUpdate {
    content: string;
}

// ========================================
// CARD HISTORY TYPES
// ========================================

export enum CardHistoryAction {
    CREATED = "CREATED",
    UPDATED = "UPDATED",
    MOVED = "MOVED",
    COMMENT_ADDED = "COMMENT_ADDED",
    COMMENT_DELETED = "COMMENT_DELETED",
    ASSIGNEE_ADDED = "ASSIGNEE_ADDED",
    ASSIGNEE_REMOVED = "ASSIGNEE_REMOVED",
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

// ========================================
// CARD/TASK TYPES
// ========================================

export interface CardAssignee {
    id: number;
    name: string;
    email: string;
}

export interface Card {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: CardPriority;
    position: number;
    column_id: number;
    project_id: number;
    due_date?: string;
    created_at: string;
    updated_at: string;
    assignees: CardAssignee[];
}

export interface CardCreateRequest {
    title: string;
    description: string;
    priority: CardPriority;
    column_id: number;
    due_date?: string;
    assignee_ids?: number[];
}

export interface CardMoveRequest {
    column_id: number;
    new_position: number;
}

export interface CardUpdateRequest {
    title?: string;
    description?: string;
    priority?: CardPriority;
    due_date?: string;
    assignee_ids?: number[];
}

export interface CardStatusUpdateRequest {
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

export interface ProjectBoard {
    board: KanbanColumn[];
    total_columns: number;
}

// ========================================
// API RESPONSE WRAPPER
// ========================================

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// ========================================
// ATTACHMENT TYPES
// ========================================

export interface AttachmentUploader {
    id: number;
    name: string;
    email: string;
}

export interface Attachment {
    id: number;
    filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    card_id: number;
    uploaded_by_id: number | null;
    created_at: string;
    uploaded_by?: AttachmentUploader;
}

export interface AttachmentListResponse {
    attachments: Attachment[];
    total: number;
}

export interface ProjectStorageInfo {
    used_bytes: number;
    used_mb: number;
    quota_bytes: number;
    quota_mb: number;
    available_bytes: number;
    available_mb: number;
    usage_percentage: number;
}

// ========================================
// UTILITY TYPES
// ========================================

export type PriorityLabel = "Urgente" | "Alta" | "Média" | "Baixa";
export type RoleLabel = "Administrador" | "Usuário";
export type StatusLabel = "Ativo" | "Inativo";

// ========================================
// TASK LINK PREVIEW TYPES
// ========================================

export interface TaskCardPreviewData {
    id: number;
    title: string;
    description: string;
    priority: CardPriority;
    status: string;
    due_date?: string;
    assignees: CardAssignee[];
}
