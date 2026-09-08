package model

import "time"

// Settings merepresentasikan tabel settings untuk mengelola konfigurasi pengguna.
type Settings struct {
	ID                      uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID                  uint      `gorm:"column:user_id;not null;unique" json:"user_id"`
	User                    Users     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	LowStockNotification    bool      `gorm:"column:low_stock_notification;default:true" json:"low_stock_notification"`
	LowStockThreshold       int       `gorm:"column:low_stock_threshold;not null;default:5" json:"low_stock_threshold"`
	TransactionNotification bool      `gorm:"column:transaction_notification;default:true" json:"transaction_notification"`
	CreatedAt               time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt               time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}