package handler

import (
	"net/http"

	"wayrung/dto"
	"wayrung/service"
	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	aiService service.AIService
}

func NewChatHandler(aiService service.AIService) *ChatHandler {
	return &ChatHandler{aiService: aiService}
}

func (h *ChatHandler) HandleChat(c *gin.Context) {
	var req dto.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format request tidak valid"})
		return
	}

	reply, err := h.aiService.AskBot(c.Request.Context(), req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ChatResponse{Reply: reply})
}