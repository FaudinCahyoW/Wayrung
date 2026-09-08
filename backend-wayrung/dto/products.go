package dto

import (
	"time"
	"wayrung/model"
)

// ProductCreateRequest merupakan struktur data permintaan pembuatan produk baru.
type ProductCreateRequest struct {
	CategoryID    uint    `json:"category_id" binding:"required"`
	Name          string  `json:"name" binding:"required"`
	SKU           string  `json:"sku" binding:"required"`
	PurchasePrice float64 `json:"purchase_price" binding:"required,gte=0"`
	SellingPrice  float64 `json:"selling_price" binding:"required,gte=0"`
	Stock         int     `json:"stock" binding:"required,gte=0"`
}

// ProductUpdateRequest merupakan struktur data permintaan pembaruan data produk.
type ProductUpdateRequest struct {
	CategoryID    uint    `json:"category_id" binding:"required"`
	Name          string  `json:"name" binding:"required"`
	SKU           string  `json:"sku" binding:"required"`
	PurchasePrice float64 `json:"purchase_price" binding:"required,gte=0"`
	SellingPrice  float64 `json:"selling_price" binding:"required,gte=0"`
	Stock         int     `json:"stock" binding:"required,gte=0"`
}

// ProductResponse merupakan struktur data respons untuk informasi produk.
type ProductResponse struct {
	ID            uint              `json:"id"`
	CategoryID    uint              `json:"category_id"`
	CategoryName  string            `json:"category_name,omitempty"`
	Name          string            `json:"name"`
	SKU           string            `json:"sku"`
	PurchasePrice float64           `json:"purchase_price"`
	SellingPrice  float64           `json:"selling_price"`
	Stock         int               `json:"stock"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

// ProductQueryRequest merupakan parameter query untuk daftar produk (paginasi & pencarian).
type ProductQueryRequest struct {
	Page   int    `form:"page" binding:"omitempty,number,gte=1"`
	Limit  int    `form:"limit" binding:"omitempty,number,gte=1"`
	Search string `form:"search" binding:"omitempty"`
	Sort   string `form:"sort" binding:"omitempty"`
}

// ToProductResponse mengonversi entity model.Products menjadi DTO ProductResponse.
func ToProductResponse(product model.Products) ProductResponse {
	return ProductResponse{
		ID:            product.ID,
		CategoryID:    product.CategoryID,
		CategoryName:  product.Category.Name,
		Name:          product.Name,
		SKU:           product.SKU,
		PurchasePrice: product.PurchasePrice,
		SellingPrice:  product.SellingPrice,
		Stock:         product.Stock,
		CreatedAt:     product.CreatedAt,
		UpdatedAt:     product.UpdatedAt,
	}
}

// ToProductResponseList mengonversi slice model.Products menjadi slice DTO ProductResponse.
func ToProductResponseList(products []model.Products) []ProductResponse {
	var responses []ProductResponse
	for _, p := range products {
		responses = append(responses, ToProductResponse(p))
	}
	return responses
}
