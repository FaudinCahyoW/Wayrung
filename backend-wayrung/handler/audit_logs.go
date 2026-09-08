package handler

import (
	"net/http"
	"wayrung/service"

	"github.com/gin-gonic/gin"
)

// AuditLogHandler mengelola request HTTP penelusuran audit log aktivitas sistem.
type AuditLogHandler struct {
	auditLogService service.AuditLogService
}

// NewAuditLogHandler membuat instance baru dari AuditLogHandler.
func NewAuditLogHandler(auditLogService service.AuditLogService) *AuditLogHandler {
	return &AuditLogHandler{auditLogService: auditLogService}
}

// FindAll mengambil seluruh riwayat aktivitas log (khusus role 'owner').
func (h *AuditLogHandler) FindAll(c *gin.Context) {
	userRoleVal, _ := c.Get("role")
	userRole := ""
	if userRoleVal != nil {
		userRole = userRoleVal.(string)
	}

	// Jika role kasir, hanya tampilkan audit log milik kasir itu sendiri
	if userRole == "kasir" {
		userIDVal, _ := c.Get("user_id")
		userID := userIDVal.(uint)
		res, err := h.auditLogService.FindByUserID(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": res})
		return
	}

	res, err := h.auditLogService.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}
