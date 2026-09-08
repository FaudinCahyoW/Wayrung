package dto

import (
	"time"
	"wayrung/model"
)

// TransactionItemRequest struktur payload untuk item barang dalam transaksi.
type TransactionItemRequest struct {
	ProductID uint `json:"product_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,gt=0"`
}

// TransactionCreateRequest struktur payload permintaan pembuatan transaksi penjualan/pembelian.
type TransactionCreateRequest struct {
	Type          string                   `json:"type" binding:"required,oneof=sale purchase"`
	PaymentMethod string                   `json:"payment_method" binding:"required"`
	Note          string                   `json:"note"`
	Items         []TransactionItemRequest `json:"items" binding:"required,gt=0,dive"`
}

// TransactionDetailResponse struktur respons rincian item transaksi.
type TransactionDetailResponse struct {
	ID          uint    `json:"id"`
	ProductID   uint    `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
	SubTotal    float64 `json:"subtotal"`
}

// TransactionResponse struktur data respons riwayat transaksi.
type TransactionResponse struct {
	ID              uint                        `json:"id"`
	UserID          uint                        `json:"user_id"`
	UserName        string                      `json:"user_name,omitempty"`
	Type            string                      `json:"type"`
	TotalAmount     float64                     `json:"total_amount"`
	PaymentMethod   string                      `json:"payment_method"`
	Note            string                      `json:"note"`
	TransactionDate time.Time                   `json:"transaction_date"`
	CreatedAt       time.Time                   `json:"created_at"`
	Details         []TransactionDetailResponse `json:"details"`
}

// ToTransactionResponse mengonversi entity model.Transactions ke DTO TransactionResponse.
func ToTransactionResponse(tx model.Transactions) TransactionResponse {
	var details []TransactionDetailResponse
	for _, d := range tx.Details {
		details = append(details, TransactionDetailResponse{
			ID:          d.ID,
			ProductID:   d.ProductID,
			ProductName: d.Product.Name,
			Quantity:    d.Quantity,
			Price:       d.Price,
			SubTotal:    d.SubTotal,
		})
	}

	return TransactionResponse{
		ID:              tx.ID,
		UserID:          tx.UserID,
		UserName:        tx.User.Name,
		Type:            tx.Type,
		TotalAmount:     tx.TotalAmount,
		PaymentMethod:   tx.PaymentMethod,
		Note:            tx.Note,
		TransactionDate: tx.TransactionDate,
		CreatedAt:       tx.CreatedAt,
		Details:         details,
	}
}

// ToTransactionResponseList mengonversi slice model.Transactions ke slice DTO TransactionResponse.
func ToTransactionResponseList(transactions []model.Transactions) []TransactionResponse {
	var list []TransactionResponse
	for _, t := range transactions {
		list = append(list, ToTransactionResponse(t))
	}
	return list
}
