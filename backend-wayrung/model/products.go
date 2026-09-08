package model

import "time"

// Products merepresentasikan tabel products di database.
type Products struct {
	ID            uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	CategoryID    uint       `gorm:"column:category_id;not null" json:"category_id"`
	Category      Categories `gorm:"foreignKey:CategoryID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"category,omitempty"`
	Name          string     `gorm:"column:name;not null" json:"name"`
	SKU           string     `gorm:"column:sku;not null;unique" json:"sku"`
	PurchasePrice float64    `gorm:"column:purchase_price;type:decimal(10,2);not null" json:"purchase_price"`
	SellingPrice  float64    `gorm:"column:selling_price;type:decimal(10,2);not null" json:"selling_price"`
	Stock         int        `gorm:"column:stock;not null" json:"stock"`
	CreatedAt     time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

