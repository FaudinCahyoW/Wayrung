package dto

import (
	"time"
	"wayrung/model"
)

// NotificationResponse struktur data respons untuk daftar/detail notifikasi.
type NotificationResponse struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// ToNotificationResponse mengonversi entity model.Notifications menjadi DTO NotificationResponse.
func ToNotificationResponse(n model.Notifications) NotificationResponse {
	return NotificationResponse{
		ID:        n.ID,
		UserID:    n.UserID,
		Type:      n.Type,
		Title:     n.Title,
		Message:   n.Message,
		IsRead:    n.IsRead,
		CreatedAt: n.CreatedAt,
	}
}

// ToNotificationResponseList mengonversi slice model.Notifications ke slice DTO NotificationResponse.
func ToNotificationResponseList(notifications []model.Notifications) []NotificationResponse {
	var list []NotificationResponse
	for _, n := range notifications {
		list = append(list, ToNotificationResponse(n))
	}
	return list
}
