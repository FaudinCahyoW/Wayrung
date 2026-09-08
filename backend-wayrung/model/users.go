package model

import "time"

// Users merepresentasikan tabel users di database dengan dukungan role (owner/kasir).
type Users struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"column:name;not null" json:"name"`
	Email     string    `gorm:"column:email;not null;unique" json:"email"`
	Password  string    `gorm:"column:password;not null" json:"-"`
	Role      string    `gorm:"column:role;type:varchar(20);not null;default:'kasir'" json:"role"` // Peran pengguna: "owner" atau "kasir"
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}