package service

import (
	"fmt"
	"wayrung/dto"
	"wayrung/model"
	"wayrung/repository"
)

// CategoryService mendefinisikan interface layanan manajemen kategori produk.
type CategoryService interface {
	// Create membuat kategori produk baru.
	Create(req dto.CategoryRequest) (dto.CategoryResponse, error)
	// FindByID mengambil detail kategori berdasarkan ID.
	FindByID(id uint) (dto.CategoryResponse, error)
	// FindAll mengambil seluruh daftar kategori produk.
	FindAll() ([]dto.CategoryResponse, error)
	// Update memperbarui data nama kategori.
	Update(id uint, req dto.CategoryRequest) (dto.CategoryResponse, error)
	// Delete menghapus kategori berdasarkan ID.
	Delete(id uint) error
}

// CategoryServiceImpl merupakan implementasi dari CategoryService.
type CategoryServiceImpl struct {
	categoryRepo repository.CategoryRepository
}

// NewCategoryService membuat instance baru dari CategoryService.
func NewCategoryService(categoryRepo repository.CategoryRepository) CategoryService {
	return &CategoryServiceImpl{categoryRepo: categoryRepo}
}

// Create menyimpan kategori baru ke database setelah pengecekan.
func (s *CategoryServiceImpl) Create(req dto.CategoryRequest) (dto.CategoryResponse, error) {
	category := model.Categories{
		Name: req.Name,
	}

	if err := s.categoryRepo.Create(&category); err != nil {
		return dto.CategoryResponse{}, fmt.Errorf("gagal membuat kategori: %w", err)
	}

	return dto.ToCategoryResponse(category), nil
}

// FindByID mencari kategori produk berdasarkan ID.
func (s *CategoryServiceImpl) FindByID(id uint) (dto.CategoryResponse, error) {
	category, err := s.categoryRepo.FindByID(id)
	if err != nil {
		return dto.CategoryResponse{}, fmt.Errorf("kategori tidak ditemukan: %w", err)
	}
	return dto.ToCategoryResponse(category), nil
}

// FindAll mengembalikan seluruh daftar kategori produk yang tersedia.
func (s *CategoryServiceImpl) FindAll() ([]dto.CategoryResponse, error) {
	categories, err := s.categoryRepo.FindAll()
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil daftar kategori: %w", err)
	}
	return dto.ToCategoryResponseList(categories), nil
}

// Update memperbarui informasi nama kategori.
func (s *CategoryServiceImpl) Update(id uint, req dto.CategoryRequest) (dto.CategoryResponse, error) {
	category, err := s.categoryRepo.FindByID(id)
	if err != nil {
		return dto.CategoryResponse{}, fmt.Errorf("kategori tidak ditemukan: %w", err)
	}

	category.Name = req.Name
	if err := s.categoryRepo.Update(&category); err != nil {
		return dto.CategoryResponse{}, fmt.Errorf("gagal memperbarui kategori: %w", err)
	}

	return dto.ToCategoryResponse(category), nil
}

// Delete menghapus kategori dari database berdasarkan ID.
func (s *CategoryServiceImpl) Delete(id uint) error {
	if _, err := s.categoryRepo.FindByID(id); err != nil {
		return fmt.Errorf("kategori tidak ditemukan: %w", err)
	}

	if err := s.categoryRepo.Delete(id); err != nil {
		return fmt.Errorf("gagal menghapus kategori: %w", err)
	}
	return nil
}
