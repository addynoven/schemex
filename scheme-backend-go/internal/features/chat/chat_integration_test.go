package chat_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/config"
	delivery "scheme-backend-go/internal/features/chat/delivery/http"
	"scheme-backend-go/internal/features/chat/dto"
	"scheme-backend-go/internal/features/chat/service"
	schemesRepo "scheme-backend-go/internal/features/schemes/repository"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
)

type MockChatRepo struct {
	mock.Mock
}

func (m *MockChatRepo) CreateChatSession(ctx context.Context, arg sqlc.CreateChatSessionParams) (sqlc.ChatSession, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.ChatSession), args.Error(1)
}

func (m *MockChatRepo) GetChatSessionByID(ctx context.Context, id int32) (sqlc.ChatSession, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(sqlc.ChatSession), args.Error(1)
}

func (m *MockChatRepo) GetChatSessionByUID(ctx context.Context, uid string) (sqlc.ChatSession, error) {
	args := m.Called(ctx, uid)
	return args.Get(0).(sqlc.ChatSession), args.Error(1)
}

func (m *MockChatRepo) ListChatSessionsByUserID(ctx context.Context, userID int32) ([]sqlc.ChatSession, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]sqlc.ChatSession), args.Error(1)
}

func (m *MockChatRepo) UpdateChatSessionTitle(ctx context.Context, id int32, title string) (sqlc.ChatSession, error) {
	args := m.Called(ctx, id, title)
	return args.Get(0).(sqlc.ChatSession), args.Error(1)
}

func (m *MockChatRepo) DeleteChatSession(ctx context.Context, id, userID int32) error {
	args := m.Called(ctx, id, userID)
	return args.Error(0)
}

func (m *MockChatRepo) CreateChatMessage(ctx context.Context, arg sqlc.CreateChatMessageParams) (sqlc.ChatMessage, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.ChatMessage), args.Error(1)
}

func (m *MockChatRepo) ListChatMessagesBySessionID(ctx context.Context, sessionID int32) ([]sqlc.ChatMessage, error) {
	args := m.Called(ctx, sessionID)
	return args.Get(0).([]sqlc.ChatMessage), args.Error(1)
}

func (m *MockChatRepo) UpsertSession(ctx context.Context, sessionUID string, userID int32, title string, lang string, createdAt time.Time) (int32, error) {
	args := m.Called(ctx, sessionUID, userID, title, lang, createdAt)
	return args.Get(0).(int32), args.Error(1)
}

func (m *MockChatRepo) InsertMessage(ctx context.Context, sessionID int32, sender string, content string, citations []byte, createdAt time.Time) error {
	args := m.Called(ctx, sessionID, sender, content, citations, createdAt)
	return args.Error(0)
}

type MockSchemesRepo struct {
	schemesRepo.SchemesRepository
	mock.Mock
}

func (m *MockSchemesRepo) ListPublishedSchemes(ctx context.Context) ([]sqlc.Scheme, error) {
	args := m.Called(ctx)
	return args.Get(0).([]sqlc.Scheme), args.Error(1)
}

func TestChat_SessionAndMessage_Flow(t *testing.T) {
	chatRepo := new(MockChatRepo)
	scRepo := new(MockSchemesRepo)

	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:               "test-secret-key-32-bytes-long!",
			AccessTokenDuration:  15 * time.Minute,
			RefreshTokenDuration: 24 * time.Hour,
		},
	}
	jwtSvc := jwt.NewService(cfg)
	chatSvc := service.NewChatService(chatRepo, scRepo, cfg)
	handler := delivery.NewChatHandler(chatSvc, jwtSvc)

	app := fiber.New(fiber.Config{
		ErrorHandler: errors.FiberErrorHandler,
	})
	handler.RegisterRoutes(app)

	tokens, _ := jwtSvc.GenerateTokenPair(7, "citizen@example.com", "citizen")

	// 1. Create Session
	sessionRecord := sqlc.ChatSession{
		ID:           101,
		SessionUid:   pgtype.Text{String: "CHAT-123456", Valid: true},
		UserID:       7,
		Title:        "Farming Assistance",
		LanguageCode: "en",
		CreatedAt:    pgtype.Timestamptz{Time: time.Now(), Valid: true},
		UpdatedAt:    pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}

	chatRepo.On("CreateChatSession", mock.Anything, mock.Anything).Return(sessionRecord, nil).Once()

	body, _ := json.Marshal(dto.ChatSessionCreate{
		Title: "Farming Assistance",
	})
	req := httptest.NewRequest(http.MethodPost, "/chat/sessions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)

	resp, err := app.Test(req, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var sessResp dto.ChatSessionResponse
	_ = json.NewDecoder(resp.Body).Decode(&sessResp)
	assert.Equal(t, int32(101), sessResp.ID)
	assert.Equal(t, "Farming Assistance", sessResp.Title)

	// 2. Send Message
	chatRepo.On("GetChatSessionByID", mock.Anything, int32(101)).Return(sessionRecord, nil).Once()
	chatRepo.On("CreateChatMessage", mock.Anything, mock.MatchedBy(func(arg sqlc.CreateChatMessageParams) bool {
		return arg.Sender == "user"
	})).Return(sqlc.ChatMessage{
		ID:        1,
		SessionID: 101,
		Sender:    "user",
		Content:   "Are there schemes for small farmers?",
		CreatedAt: pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}, nil).Once()

	sampleScheme := sqlc.Scheme{
		ID:          1,
		Name:        "PM Kisan",
		Slug:        "pm-kisan",
		State:       "ALL_INDIA",
		Category:    "Agriculture",
		Description: "Income support for farmers",
		Status:      "active",
	}
	scRepo.On("ListPublishedSchemes", mock.Anything).Return([]sqlc.Scheme{sampleScheme}, nil).Once()

	chatRepo.On("CreateChatMessage", mock.Anything, mock.MatchedBy(func(arg sqlc.CreateChatMessageParams) bool {
		return arg.Sender == "assistant"
	})).Return(sqlc.ChatMessage{
		ID:        2,
		SessionID: 101,
		Sender:    "assistant",
		Content:   "You qualify for 1 scheme based on your criteria.",
		CreatedAt: pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}, nil).Once()

	msgBody, _ := json.Marshal(dto.ChatMessageCreate{
		Content: "Are there schemes for small farmers?",
	})
	msgReq := httptest.NewRequest(http.MethodPost, "/chat/sessions/101/messages", bytes.NewReader(msgBody))
	msgReq.Header.Set("Content-Type", "application/json")
	msgReq.Header.Set("Authorization", "Bearer "+tokens.AccessToken)

	msgResp, err := app.Test(msgReq, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, msgResp.StatusCode)

	var chatMsgResp dto.ChatMessageResponse
	_ = json.NewDecoder(msgResp.Body).Decode(&chatMsgResp)
	assert.Equal(t, "assistant", chatMsgResp.Sender)
	assert.Contains(t, chatMsgResp.Citations, "pm-kisan")
	assert.Len(t, chatMsgResp.Sources, 1)
	assert.Equal(t, "pm-kisan", chatMsgResp.Sources[0].Slug)
}
