package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"scheme-backend-go/gen/sqlc"
)

type ChatRepository interface {
	CreateChatSession(ctx context.Context, arg sqlc.CreateChatSessionParams) (sqlc.ChatSession, error)
	GetChatSessionByID(ctx context.Context, id int32) (sqlc.ChatSession, error)
	GetChatSessionByUID(ctx context.Context, uid string) (sqlc.ChatSession, error)
	ListChatSessionsByUserID(ctx context.Context, userID int32) ([]sqlc.ChatSession, error)
	UpdateChatSessionTitle(ctx context.Context, id int32, title string) (sqlc.ChatSession, error)
	DeleteChatSession(ctx context.Context, id, userID int32) error
	CreateChatMessage(ctx context.Context, arg sqlc.CreateChatMessageParams) (sqlc.ChatMessage, error)
	ListChatMessagesBySessionID(ctx context.Context, sessionID int32) ([]sqlc.ChatMessage, error)
	UpsertSession(ctx context.Context, sessionUID string, userID int32, title string, lang string, createdAt time.Time) (int32, error)
	InsertMessage(ctx context.Context, sessionID int32, sender string, content string, citations []byte, createdAt time.Time) error
}

type chatRepository struct {
	queries *sqlc.Queries
	pool    *pgxpool.Pool
}

func NewChatRepository(pool *pgxpool.Pool) ChatRepository {
	return &chatRepository{
		queries: sqlc.New(pool),
		pool:    pool,
	}
}

func (r *chatRepository) CreateChatSession(ctx context.Context, arg sqlc.CreateChatSessionParams) (sqlc.ChatSession, error) {
	return r.queries.CreateChatSession(ctx, arg)
}

func (r *chatRepository) GetChatSessionByID(ctx context.Context, id int32) (sqlc.ChatSession, error) {
	return r.queries.GetChatSessionByID(ctx, id)
}

func (r *chatRepository) GetChatSessionByUID(ctx context.Context, uid string) (sqlc.ChatSession, error) {
	return r.queries.GetChatSessionByUID(ctx, pgtype.Text{String: uid, Valid: true})
}

func (r *chatRepository) ListChatSessionsByUserID(ctx context.Context, userID int32) ([]sqlc.ChatSession, error) {
	return r.queries.ListChatSessionsByUserID(ctx, userID)
}

func (r *chatRepository) UpdateChatSessionTitle(ctx context.Context, id int32, title string) (sqlc.ChatSession, error) {
	return r.queries.UpdateChatSessionTitle(ctx, sqlc.UpdateChatSessionTitleParams{
		ID:    id,
		Title: title,
	})
}

func (r *chatRepository) DeleteChatSession(ctx context.Context, id, userID int32) error {
	return r.queries.DeleteChatSession(ctx, sqlc.DeleteChatSessionParams{
		ID:     id,
		UserID: userID,
	})
}

func (r *chatRepository) CreateChatMessage(ctx context.Context, arg sqlc.CreateChatMessageParams) (sqlc.ChatMessage, error) {
	return r.queries.CreateChatMessage(ctx, arg)
}

func (r *chatRepository) ListChatMessagesBySessionID(ctx context.Context, sessionID int32) ([]sqlc.ChatMessage, error) {
	return r.queries.ListChatMessagesBySessionID(ctx, sessionID)
}

func (r *chatRepository) UpsertSession(ctx context.Context, sessionUID string, userID int32, title string, lang string, createdAt time.Time) (int32, error) {
	var id int32
	query := `
		INSERT INTO chat_sessions (session_uid, user_id, title, language_code, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $5)
		ON CONFLICT (session_uid) DO UPDATE
		SET updated_at = EXCLUDED.updated_at
		RETURNING id
	`
	err := r.pool.QueryRow(ctx, query, sessionUID, userID, title, lang, createdAt).Scan(&id)
	return id, err
}

func (r *chatRepository) InsertMessage(ctx context.Context, sessionID int32, sender string, content string, citations []byte, createdAt time.Time) error {
	query := `
		INSERT INTO chat_messages (session_id, sender, content, citations, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.pool.Exec(ctx, query, sessionID, sender, content, citations, createdAt)
	return err
}
