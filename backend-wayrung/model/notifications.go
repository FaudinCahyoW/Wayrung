package model

import "time"

// Notifications merepresentasikan tabel notifications di database.
type Notifications struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"column:user_id;not null" json:"user_id"`
	User      Users     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Type      string    `gorm:"column:type;not null" json:"type"`
	Title     string    `gorm:"column:title;not null" json:"title"`
	Message   string    `gorm:"column:message;type:text" json:"message"`
	IsRead    bool      `gorm:"column:is_read;default:false" json:"is_read"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}