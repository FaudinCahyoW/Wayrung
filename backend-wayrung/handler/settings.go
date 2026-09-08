package handler

import (
	"net/http"
	"wayrung/dto"
	"wayrung/service"

	"github.com/gin-gonic/gin"
)

// SettingsHandler mengelola endpoint HTTP untuk konfigurasi preferensi pengguna.
type SettingsHandler struct {
	settingsService service.SettingsService
}

// NewSettingsHandler membuat instance baru dari SettingsHandler.
func NewSettingsHandler(settingsService service.SettingsService) *SettingsHandler {
	return &SettingsHandler{settingsService: settingsService}
}

// GetSettings mengambil data pengaturan milik pengguna terautentikasi.
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Pengguna belum terautentikasi"})
		return
	}
	userID := userIDVal.(uint)

	res, err := h.settingsService.GetByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}

// UpdateSettings menyimpan perubahan preferensi pengaturan pengguna.
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Pengguna belum terautentikasi"})
		return
	}
	userID := userIDVal.(uint)

	var req dto.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.settingsService.Update(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pengaturan berhasil diperbarui",
		"data":    res,
	})
}
