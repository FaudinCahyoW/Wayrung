package dto

import (
	"time"
	"wayrung/model"
)

// UpdateSettingsRequest struktur payload untuk memperbarui pengaturan pengguna.
type UpdateSettingsRequest struct {
	LowStockNotification    *bool `json:"low_stock_notification" binding:"required"`
	LowStockThreshold       *int  `json:"low_stock_threshold" binding:"required,gte=0"`
	TransactionNotification *bool `json:"transaction_notification" binding:"required"`
}

// SettingsResponse struktur data respons konfigurasi pengaturan pengguna.
type SettingsResponse struct {
	ID                      uint      `json:"id"`
	UserID                  uint      `json:"user_id"`
	LowStockNotification    bool      `json:"low_stock_notification"`
	LowStockThreshold       int       `json:"low_stock_threshold"`
	TransactionNotification bool      `json:"transaction_notification"`
	CreatedAt               time.Time `json:"created_at"`
	UpdatedAt               time.Time `json:"updated_at"`
}

// ToSettingsResponse mengonversi entity model.Settings ke DTO SettingsResponse.
func ToSettingsResponse(s model.Settings) SettingsResponse {
	return SettingsResponse{
		ID:                      s.ID,
		UserID:                  s.UserID,
		LowStockNotification:    s.LowStockNotification,
		LowStockThreshold:       s.LowStockThreshold,
		TransactionNotification: s.TransactionNotification,
		CreatedAt:               s.CreatedAt,
		UpdatedAt:               s.UpdatedAt,
	}
}
