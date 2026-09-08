package model

// TransactionDetails merepresentasikan rincian item dalam setiap transaksi.
type TransactionDetails struct {
	ID            uint     `gorm:"primaryKey;autoIncrement" json:"id"`
	TransactionID uint     `gorm:"column:transaction_id;not null" json:"transaction_id"`
	ProductID     uint     `gorm:"column:product_id;not null" json:"product_id"`
	Product       Products `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Quantity      int      `gorm:"column:quantity;type:int;not null" json:"quantity"`
	Price         float64  `gorm:"column:price;type:decimal(10,2);not null" json:"price"`
	SubTotal      float64  `gorm:"column:subtotal;type:decimal(10,2);not null" json:"subtotal"`
}