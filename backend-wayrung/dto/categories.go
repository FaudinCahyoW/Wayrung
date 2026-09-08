package dto

import (
	"time"
	"wayrung/model"
)

// CategoryRequest struktur payload untuk membuat atau memperbarui kategori produk.
type CategoryRequest struct {
	Name string `json:"name" binding:"required"`
}

// CategoryResponse struktur data respons untuk informasi kategori produk.
type CategoryResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToCategoryResponse mengonversi model.Categories menjadi CategoryResponse DTO.
func ToCategoryResponse(category model.Categories) CategoryResponse {
	return CategoryResponse{
		ID:        category.ID,
		Name:      category.Name,
		CreatedAt: category.CreatedAt,
		UpdatedAt: category.UpdatedAt,
	}
}

// ToCategoryResponseList mengonversi slice model.Categories menjadi slice CategoryResponse DTO.
func ToCategoryResponseList(categories []model.Categories) []CategoryResponse {
	var list []CategoryResponse
	for _, c := range categories {
		list = append(list, ToCategoryResponse(c))
	}
	return list
}
