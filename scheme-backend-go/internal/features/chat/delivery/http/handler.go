package http

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"scheme-backend-go/internal/features/chat/dto"
	"scheme-backend-go/internal/features/chat/service"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
	"scheme-backend-go/internal/pkg/middleware"
)

type ChatHandler struct {
	svc    service.ChatService
	jwtSvc *jwt.Service
}

func NewChatHandler(svc service.ChatService, jwtSvc *jwt.Service) *ChatHandler {
	return &ChatHandler{
		svc:    svc,
		jwtSvc: jwtSvc,
	}
}

func resolveUserID(c *fiber.Ctx) int32 {
	userID, err := middleware.GetUserID(c)
	if err != nil || userID == 0 {
		return 5 // Default demo citizen Ramesh for guest/unauthenticated access
	}
	return userID
}

func (h *ChatHandler) RegisterRoutes(router fiber.Router) {
	chat := router.Group("/chat", middleware.OptionalAuth(h.jwtSvc))
	chat.Post("/sessions", h.CreateSession)
	chat.Get("/sessions", h.ListSessions)
	chat.Get("/sessions/:id", h.GetSession)
	chat.Patch("/sessions/:id", h.UpdateSession)
	chat.Delete("/sessions/:id", h.DeleteSession)
	chat.Post("/sessions/:id/messages", h.SendMessage)
	chat.Post("/sessions/:id/messages/stream", h.StreamMessage)
	chat.Post("/sync", h.Sync)
}

func (h *ChatHandler) CreateSession(c *fiber.Ctx) error {
	userID := resolveUserID(c)

	var req dto.ChatSessionCreate
	_ = c.BodyParser(&req)

	resp, err := h.svc.CreateSession(c.UserContext(), userID, req)
	if err != nil {
		return err
	}

	return c.Status(http.StatusCreated).JSON(resp)
}

func (h *ChatHandler) ListSessions(c *fiber.Ctx) error {
	userID := resolveUserID(c)

	resp, err := h.svc.ListSessions(c.UserContext(), userID)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *ChatHandler) GetSession(c *fiber.Ctx) error {
	userID := resolveUserID(c)

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return errors.BadRequest("Invalid session ID")
	}

	resp, err := h.svc.GetSession(c.UserContext(), int32(id), userID)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *ChatHandler) UpdateSession(c *fiber.Ctx) error {
	userID := resolveUserID(c)

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return errors.BadRequest("Invalid session ID")
	}

	var req dto.ChatSessionUpdate
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	resp, err := h.svc.UpdateSessionTitle(c.UserContext(), int32(id), userID, req.Title)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *ChatHandler) DeleteSession(c *fiber.Ctx) error {
	userID := resolveUserID(c)

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return errors.BadRequest("Invalid session ID")
	}

	if err := h.svc.DeleteSession(c.UserContext(), int32(id), userID); err != nil {
		return err
	}

	return c.SendStatus(http.StatusNoContent)
}

func (h *ChatHandler) SendMessage(c *fiber.Ctx) error {
	userID := resolveUserID(c)

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return errors.BadRequest("Invalid session ID")
	}

	var req dto.ChatMessageCreate
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	resp, err := h.svc.SendMessage(c.UserContext(), int32(id), userID, req.Content, req.LanguageCode)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *ChatHandler) StreamMessage(c *fiber.Ctx) error {
	userID := resolveUserID(c)

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return errors.BadRequest("Invalid session ID")
	}

	var req dto.ChatMessageCreate
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	// Send message and get structured response
	resp, err := h.svc.SendMessage(c.UserContext(), int32(id), userID, req.Content, req.LanguageCode)
	if err != nil {
		return err
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		// Stream content chunk
		chunk := map[string]interface{}{
			"type":    "text",
			"content": resp.Content,
		}
		data, _ := json.Marshal(chunk)
		fmt.Fprintf(w, "data: %s\n\n", data)
		_ = w.Flush()

		// Stream citations & sources
		sourcesChunk := map[string]interface{}{
			"type":      "sources",
			"citations": resp.Citations,
			"sources":   resp.Sources,
		}
		srcData, _ := json.Marshal(sourcesChunk)
		fmt.Fprintf(w, "data: %s\n\n", srcData)
		_ = w.Flush()

		// Send [DONE]
		fmt.Fprintf(w, "data: [DONE]\n\n")
		_ = w.Flush()
	})

	return nil
}

func (h *ChatHandler) Sync(c *fiber.Ctx) error {
	userID := resolveUserID(c)

	var req dto.ChatSyncRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid sync payload")
	}

	resp, err := h.svc.Sync(c.UserContext(), userID, req)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}
