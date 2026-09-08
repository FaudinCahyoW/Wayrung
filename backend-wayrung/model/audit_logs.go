package model

import "time"

// AuditLogs merepresentasikan tabel audit_logs untuk mencatat riwayat aktivitas pengguna.
type AuditLogs struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      uint      `gorm:"column:user_id;not null" json:"user_id"`
	User        Users     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Action      string    `gorm:"column:action;not null" json:"action"`
	EntityType  string    `gorm:"column:entity_type;not null" json:"entity_type"`
	EntityID    uint      `gorm:"column:entity_id;not null" json:"entity_id"`
	Description string    `gorm:"column:description;type:text" json:"description"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}