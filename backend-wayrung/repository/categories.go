package repository

import (
	"wayrung/model"

	"gorm.io/gorm"
)

// CategoryRepository mendefinisikan interface operasi data kategori produk.
type CategoryRepository interface {
	// Create menyimpan kategori produk baru.
	Create(category *model.Categories) error
	// FindByID mencari kategori berdasarkan ID.
	FindByID(id uint) (model.Categories, error)
	// FindAll mengambil seluruh daftar kategori produk.
	FindAll() ([]model.Categories, error)
	// Update memperbarui data kategori.
	Update(category *model.Categories) error
	// Delete menghapus kategori berdasarkan ID.
	Delete(id uint) error
}

// CategoryRepositoryImpl merupakan implementasi dari CategoryRepository menggunakan GORM.
type CategoryRepositoryImpl struct {
	db *gorm.DB
}

// NewCategoryRepository membuat instance baru dari CategoryRepository.
func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &CategoryRepositoryImpl{db: db}
}

// Create menyimpan kategori baru ke database.
func (r *CategoryRepositoryImpl) Create(category *model.Categories) error {
	return r.db.Create(category).Error
}

// FindByID mengambil data kategori berdasarkan ID primary key.
func (r *CategoryRepositoryImpl) FindByID(id uint) (model.Categories, error) {
	var category model.Categories
	err := r.db.First(&category, id).Error
	return category, err
}

// FindAll mengambil seluruh kategori yang tersimpan di database.
func (r *CategoryRepositoryImpl) FindAll() ([]model.Categories, error) {
	var categories []model.Categories
	err := r.db.Order("name ASC").Find(&categories).Error
	return categories, err
}

// Update memperbarui nama kategori di database.
func (r *CategoryRepositoryImpl) Update(category *model.Categories) error {
	return r.db.Save(category).Error
}

// Delete menghapus kategori berdasarkan ID.
func (r *CategoryRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&model.Categories{}, id).Error
}
