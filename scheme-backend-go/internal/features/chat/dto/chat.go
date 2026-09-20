package dto

import "time"

type ChatMessageCreate struct {
	Content      string `json:"content" validate:"required"`
	LanguageCode string `json:"language_code"`
}

type SchemeCitation struct {
	Title        string  `json:"title"`
	Slug         string  `json:"slug"`
	Summary      *string `json:"summary,omitempty"`
	Category     *string `json:"category,omitempty"`
	State        *string `json:"state,omitempty"`
	Jurisdiction *string `json:"jurisdiction,omitempty"`
}

type ChatMessageResponse struct {
	ID        int32            `json:"id"`
	SessionID int32            `json:"session_id"`
	Sender    string           `json:"sender"`
	Content   string           `json:"content"`
	Status    string           `json:"status"`
	Intent    *string          `json:"intent,omitempty"`
	Citations []string         `json:"citations"`
	Sources   []SchemeCitation `json:"sources"`
	CreatedAt time.Time        `json:"created_at"`
}

type ChatSessionCreate struct {
	Title        string `json:"title"`
	LanguageCode string `json:"language_code"`
}

type ChatSessionUpdate struct {
	Title string `json:"title" validate:"required"`
}

type ChatSessionResponse struct {
	ID           int32                 `json:"id"`
	SessionUID   *string               `json:"session_uid,omitempty"`
	UserID       int32                 `json:"user_id"`
	Title        string                `json:"title"`
	LanguageCode string                `json:"language_code"`
	CreatedAt    time.Time             `json:"created_at"`
	UpdatedAt    time.Time             `json:"updated_at"`
	Messages     []ChatMessageResponse `json:"messages"`
}

type SyncSessionItem struct {
	SessionUID   string `json:"session_uid"`
	Title        string `json:"title"`
	LanguageCode string `json:"language_code"`
	CreatedAt    string `json:"created_at"`
}

type SyncMessageItem struct {
	SessionUID string   `json:"session_uid"`
	MessageUID string   `json:"message_uid"`
	Sender     string   `json:"sender"`
	Content    string   `json:"content"`
	Citations  []string `json:"citations"`
	CreatedAt  string   `json:"created_at"`
}

type ChatSyncRequest struct {
	Sessions []SyncSessionItem `json:"sessions"`
	Messages []SyncMessageItem `json:"messages"`
}

type ChatSyncResponse struct {
	SyncedSessionUIDs []string              `json:"synced_session_uids"`
	SyncedMessageUIDs []string              `json:"synced_message_uids"`
	CloudSessions     []ChatSessionResponse `json:"cloud_sessions"`
}
