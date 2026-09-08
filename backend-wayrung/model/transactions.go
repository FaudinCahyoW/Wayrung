package model

import "time"

// Transactions merepresentasikan tabel transactions di database.
type Transactions struct {
	ID              uint                 `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID          uint                 `gorm:"column:user_id;not null" json:"user_id"`
	User            Users                `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Type            string               `gorm:"column:type;not null" json:"type"`
	TotalAmount     float64              `gorm:"column:total_amount;type:decimal(10,2);not null" json:"total_amount"`
	PaymentMethod   string               `gorm:"column:payment_method;not null" json:"payment_method"`
	Note            string               `gorm:"column:note;type:text" json:"note"`
	TransactionDate time.Time            `gorm:"column:transaction_date;autoCreateTime" json:"transaction_date"`
	CreatedAt       time.Time            `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	Details         []TransactionDetails `gorm:"foreignKey:TransactionID" json:"details,omitempty"`
}