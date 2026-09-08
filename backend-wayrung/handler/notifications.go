package handler

import (
	"net/http"
	"strconv"
	"wayrung/service"

	"github.com/gin-gonic/gin"
)

// NotificationHandler mengelola endpoint HTTP notifikasi pengguna.
type NotificationHandler struct {
	notificationService service.NotificationService
}

// NewNotificationHandler membuat instance baru dari NotificationHandler.
func NewNotificationHandler(notificationService service.NotificationService) *NotificationHandler {
	return &NotificationHandler{notificationService: notificationService}
}

// GetNotifications mengambil seluruh daftar notifikasi pengguna terautentikasi.
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Pengguna belum terautentikasi"})
		return
	}
	userID := userIDVal.(uint)

	res, err := h.notificationService.GetByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}

// MarkAsRead menandai notifikasi pengguna tertentu sebagai sudah dibaca.
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Pengguna belum terautentikasi"})
		return
	}
	userID := userIDVal.(uint)

	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID notifikasi tidak valid"})
		return
	}

	if err := h.notificationService.MarkAsRead(uint(id), userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notifikasi ditandai sebagai sudah dibaca"})
}
