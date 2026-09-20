package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/config"
	"scheme-backend-go/internal/features/chat/dto"
	"scheme-backend-go/internal/features/chat/repository"
	schemesRepo "scheme-backend-go/internal/features/schemes/repository"
	"scheme-backend-go/internal/pkg/errors"
)

type ChatService interface {
	CreateSession(ctx context.Context, userID int32, req dto.ChatSessionCreate) (*dto.ChatSessionResponse, error)
	ListSessions(ctx context.Context, userID int32) ([]dto.ChatSessionResponse, error)
	GetSession(ctx context.Context, sessionID int32, userID int32) (*dto.ChatSessionResponse, error)
	UpdateSessionTitle(ctx context.Context, sessionID int32, userID int32, title string) (*dto.ChatSessionResponse, error)
	DeleteSession(ctx context.Context, sessionID int32, userID int32) error
	SendMessage(ctx context.Context, sessionID int32, userID int32, content string, lang string) (*dto.ChatMessageResponse, error)
	Sync(ctx context.Context, userID int32, req dto.ChatSyncRequest) (*dto.ChatSyncResponse, error)
}

type chatService struct {
	repo        repository.ChatRepository
	schemesRepo schemesRepo.SchemesRepository
	cfg         *config.Config
	client      *http.Client
}

func NewChatService(repo repository.ChatRepository, schemesRepo schemesRepo.SchemesRepository, cfg *config.Config) ChatService {
	return &chatService{
		repo:        repo,
		schemesRepo: schemesRepo,
		cfg:         cfg,
		client:      &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *chatService) CreateSession(ctx context.Context, userID int32, req dto.ChatSessionCreate) (*dto.ChatSessionResponse, error) {
	title := req.Title
	if title == "" {
		title = "New Welfare Conversation"
	}
	lang := req.LanguageCode
	if lang == "" {
		lang = "en"
	}

	sessionUID := "CHAT-" + uuid.New().String()
	sess, err := s.repo.CreateChatSession(ctx, sqlc.CreateChatSessionParams{
		SessionUid:   pgtype.Text{String: sessionUID, Valid: true},
		UserID:       userID,
		Title:        title,
		LanguageCode: lang,
	})
	if err != nil {
		return nil, errors.Internal(fmt.Sprintf("Failed to create chat session: %v", err))
	}

	var uidStr *string
	if sess.SessionUid.Valid {
		uidStr = &sess.SessionUid.String
	}

	return &dto.ChatSessionResponse{
		ID:           sess.ID,
		SessionUID:   uidStr,
		UserID:       sess.UserID,
		Title:        sess.Title,
		LanguageCode: sess.LanguageCode,
		CreatedAt:    sess.CreatedAt.Time,
		UpdatedAt:    sess.UpdatedAt.Time,
		Messages:     []dto.ChatMessageResponse{},
	}, nil
}

func (s *chatService) ListSessions(ctx context.Context, userID int32) ([]dto.ChatSessionResponse, error) {
	sessions, err := s.repo.ListChatSessionsByUserID(ctx, userID)
	if err != nil {
		return nil, errors.Internal("Failed to list chat sessions")
	}

	res := make([]dto.ChatSessionResponse, len(sessions))
	for i, sess := range sessions {
		var uid *string
		if sess.SessionUid.Valid {
			uid = &sess.SessionUid.String
		}
		res[i] = dto.ChatSessionResponse{
			ID:           sess.ID,
			SessionUID:   uid,
			UserID:       sess.UserID,
			Title:        sess.Title,
			LanguageCode: sess.LanguageCode,
			CreatedAt:    sess.CreatedAt.Time,
			UpdatedAt:    sess.UpdatedAt.Time,
			Messages:     []dto.ChatMessageResponse{},
		}
	}

	return res, nil
}

func (s *chatService) GetSession(ctx context.Context, sessionID int32, userID int32) (*dto.ChatSessionResponse, error) {
	sess, err := s.repo.GetChatSessionByID(ctx, sessionID)
	if err != nil || sess.UserID != userID {
		return nil, errors.NotFound("Chat session not found")
	}

	messages, err := s.repo.ListChatMessagesBySessionID(ctx, sessionID)
	if err != nil {
		return nil, errors.Internal("Failed to load chat messages")
	}

	msgDTOs := make([]dto.ChatMessageResponse, len(messages))
	for i, m := range messages {
		var citations []string
		_ = json.Unmarshal(m.Citations, &citations)

		var intent *string
		if m.Intent.Valid {
			intent = &m.Intent.String
		}

		msgDTOs[i] = dto.ChatMessageResponse{
			ID:        m.ID,
			SessionID: m.SessionID,
			Sender:    m.Sender,
			Content:   m.Content,
			Status:    "success",
			Intent:    intent,
			Citations: citations,
			CreatedAt: m.CreatedAt.Time,
		}
	}

	var sessUID *string
	if sess.SessionUid.Valid {
		sessUID = &sess.SessionUid.String
	}

	return &dto.ChatSessionResponse{
		ID:           sess.ID,
		SessionUID:   sessUID,
		UserID:       sess.UserID,
		Title:        sess.Title,
		LanguageCode: sess.LanguageCode,
		CreatedAt:    sess.CreatedAt.Time,
		UpdatedAt:    sess.UpdatedAt.Time,
		Messages:     msgDTOs,
	}, nil
}

func (s *chatService) UpdateSessionTitle(ctx context.Context, sessionID int32, userID int32, title string) (*dto.ChatSessionResponse, error) {
	sess, err := s.repo.GetChatSessionByID(ctx, sessionID)
	if err != nil || sess.UserID != userID {
		return nil, errors.NotFound("Chat session not found")
	}

	updated, err := s.repo.UpdateChatSessionTitle(ctx, sessionID, title)
	if err != nil {
		return nil, errors.Internal("Failed to update session title")
	}

	return s.GetSession(ctx, updated.ID, userID)
}

func (s *chatService) DeleteSession(ctx context.Context, sessionID int32, userID int32) error {
	sess, err := s.repo.GetChatSessionByID(ctx, sessionID)
	if err != nil || sess.UserID != userID {
		return errors.NotFound("Chat session not found")
	}
	return s.repo.DeleteChatSession(ctx, sessionID, userID)
}

func (s *chatService) SendMessage(ctx context.Context, sessionID int32, userID int32, content string, lang string) (*dto.ChatMessageResponse, error) {
	sess, err := s.repo.GetChatSessionByID(ctx, sessionID)
	if err != nil || sess.UserID != userID {
		return nil, errors.NotFound("Chat session not found")
	}

	// 1. Save citizen's message
	emptyCitations, _ := json.Marshal([]string{})
	_, err = s.repo.CreateChatMessage(ctx, sqlc.CreateChatMessageParams{
		SessionID: sessionID,
		Sender:    "user",
		Content:   content,
		Intent:    pgtype.Text{Valid: false},
		Citations: emptyCitations,
	})
	if err != nil {
		return nil, errors.Internal("Failed to persist citizen message")
	}

	// 2. Generate advisor response & matching scheme citations
	assistantReply, sources, citations := s.generateAdvisorResponse(ctx, content, lang)

	// 3. Save assistant's message
	citJSON, _ := json.Marshal(citations)
	intentStr := "scheme_recommendation"
	assistantMsg, err := s.repo.CreateChatMessage(ctx, sqlc.CreateChatMessageParams{
		SessionID: sessionID,
		Sender:    "assistant",
		Content:   assistantReply,
		Intent:    pgtype.Text{String: intentStr, Valid: true},
		Citations: citJSON,
	})
	if err != nil {
		return nil, errors.Internal("Failed to persist assistant response")
	}

	// Update session title if first turn
	if sess.Title == "New Welfare Conversation" && len(content) > 0 {
		runes := []rune(content)
		shortTitle := string(runes)
		if len(runes) > 30 {
			shortTitle = string(runes[:30]) + "..."
		}
		_, _ = s.repo.UpdateChatSessionTitle(ctx, sessionID, shortTitle)
	}

	return &dto.ChatMessageResponse{
		ID:        assistantMsg.ID,
		SessionID: assistantMsg.SessionID,
		Sender:    "assistant",
		Content:   assistantReply,
		Status:    "success",
		Intent:    &intentStr,
		Citations: citations,
		Sources:   sources,
		CreatedAt: assistantMsg.CreatedAt.Time,
	}, nil
}

func (s *chatService) generateAdvisorResponse(ctx context.Context, userPrompt string, lang string) (reply string, sources []dto.SchemeCitation, citations []string) {
	lower := strings.ToLower(strings.TrimSpace(userPrompt))

	// Direct greetings
	if lower == "hi" || lower == "hello" || lower == "hey" || lower == "namaste" {
		return "Hello Citizen! I am your Sovereign Citizen Welfare AI Advisor. How can I assist you with government welfare programs, scholarships, or loans today?", nil, nil
	}

	// Search matching schemes in database
	allSchemes, _ := s.schemesRepo.ListPublishedSchemes(ctx)

	var matched []sqlc.Scheme
	for _, sc := range allSchemes {
		m := strings.Contains(lower, strings.ToLower(sc.Name)) ||
			strings.Contains(lower, strings.ToLower(sc.Category)) ||
			strings.Contains(lower, strings.ToLower(sc.State)) ||
			strings.Contains(lower, strings.ToLower(sc.Ministry)) ||
			(sc.Tags.Valid && strings.Contains(lower, strings.ToLower(sc.Tags.String)))

		// Also check domain terms
		if strings.Contains(lower, "farmer") || strings.Contains(lower, "kisan") || strings.Contains(lower, "crop") || strings.Contains(lower, "agriculture") {
			if strings.EqualFold(sc.Category, "Agriculture") {
				m = true
			}
		}
		if strings.Contains(lower, "student") || strings.Contains(lower, "scholarship") || strings.Contains(lower, "education") {
			if strings.EqualFold(sc.Category, "Education") {
				m = true
			}
		}
		if strings.Contains(lower, "health") || strings.Contains(lower, "ayushman") || strings.Contains(lower, "hospital") {
			if strings.EqualFold(sc.Category, "Healthcare") {
				m = true
			}
		}

		if m {
			matched = append(matched, sc)
		}
	}

	// Fallback to all published if no direct keyword matched
	if len(matched) == 0 && len(allSchemes) > 0 {
		matched = allSchemes
	}

	// Limit to top 3 recommendations
	if len(matched) > 3 {
		matched = matched[:3]
	}

	for _, sc := range matched {
		citations = append(citations, sc.Slug)
		var sum *string
		if len(sc.Description) > 120 {
			s := sc.Description[:120] + "..."
			sum = &s
		} else {
			sum = &sc.Description
		}
		cat := sc.Category
		st := sc.State
		sources = append(sources, dto.SchemeCitation{
			Title:        sc.Name,
			Slug:         sc.Slug,
			Summary:      sum,
			Category:     &cat,
			State:        &st,
			Jurisdiction: &sc.State,
		})
	}

	// If Gemini key is available, attempt to get AI explanation
	if s.cfg.Gemini.APIKey != "" {
		if aiText, err := s.callGemini(ctx, userPrompt, sources); err == nil && aiText != "" {
			return aiText, sources, citations
		}
	}

	// Clean formatted response following team UX rules
	count := len(matched)
	reply = fmt.Sprintf("You qualify for **%d schemes** based on your criteria.\n\nTop recommendations:", count)
	return reply, sources, citations
}

func (s *chatService) callGemini(ctx context.Context, userPrompt string, sources []dto.SchemeCitation) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", s.cfg.Gemini.APIKey)

	sysInstruction := `You are the Sovereign Citizen Welfare AI Advisor. Provide concise, empathetic assistance to Indian citizens regarding government schemes.
CRITICAL FORMATTING RULE:
Provide a punchy, easy-to-skim summary under 3 lines. Do NOT print a numbered list of schemes or raw URLs in your text. The app displays interactive scheme cards below your message. Keep the message under 50 words.`

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": sysInstruction},
					{"text": userPrompt},
				},
			},
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini returned status %d", resp.StatusCode)
	}

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var res struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(respBytes, &res); err != nil || len(res.Candidates) == 0 || len(res.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("failed to parse gemini response")
	}

	return strings.TrimSpace(res.Candidates[0].Content.Parts[0].Text), nil
}

func (s *chatService) Sync(ctx context.Context, userID int32, req dto.ChatSyncRequest) (*dto.ChatSyncResponse, error) {
	syncedSessionUIDs := make([]string, 0, len(req.Sessions))
	syncedMessageUIDs := make([]string, 0, len(req.Messages))
	sessionIDMap := make(map[string]int32)

	// 1. Upsert sessions
	for _, sess := range req.Sessions {
		t, err := time.Parse(time.RFC3339, sess.CreatedAt)
		if err != nil {
			t = time.Now()
		}
		title := sess.Title
		if title == "" {
			title = "New Welfare Conversation"
		}
		lang := sess.LanguageCode
		if lang == "" {
			lang = "en"
		}

		id, err := s.repo.UpsertSession(ctx, sess.SessionUID, userID, title, lang, t)
		if err == nil {
			syncedSessionUIDs = append(syncedSessionUIDs, sess.SessionUID)
			sessionIDMap[sess.SessionUID] = id
		}
	}

	// 2. Insert messages
	for _, msg := range req.Messages {
		sessID, exists := sessionIDMap[msg.SessionUID]
		if !exists {
			dbSess, err := s.repo.GetChatSessionByUID(ctx, msg.SessionUID)
			if err == nil && dbSess.UserID == userID {
				sessID = dbSess.ID
				sessionIDMap[msg.SessionUID] = sessID
			} else {
				continue
			}
		}

		t, err := time.Parse(time.RFC3339, msg.CreatedAt)
		if err != nil {
			t = time.Now()
		}

		citationsJSON, _ := json.Marshal(msg.Citations)
		err = s.repo.InsertMessage(ctx, sessID, msg.Sender, msg.Content, citationsJSON, t)
		if err == nil {
			syncedMessageUIDs = append(syncedMessageUIDs, msg.MessageUID)
		}
	}

	// 3. Return full list of cloud sessions for this user
	cloudSessions, err := s.ListSessions(ctx, userID)
	if err != nil {
		cloudSessions = []dto.ChatSessionResponse{}
	}

	return &dto.ChatSyncResponse{
		SyncedSessionUIDs: syncedSessionUIDs,
		SyncedMessageUIDs: syncedMessageUIDs,
		CloudSessions:     cloudSessions,
	}, nil
}
