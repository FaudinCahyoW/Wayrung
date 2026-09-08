package repository

import (
	"wayrung/model"

	"gorm.io/gorm"
)

// ProductRepository mendefinisikan interface untuk operasi data produk.
type ProductRepository interface {
	// Create menambahkan data produk baru ke database.
	Create(product *model.Products) error
	// FindByID mengambil data produk berdasarkan ID beserta relasi kategorinya.
	FindByID(id uint) (model.Products, error)
	// FindAll mengambil seluruh data produk beserta kategorinya.
	FindAll() ([]model.Products, error)
	// FindAllPagination mengambil data produk dengan pagination, pencarian, dan pengurutan.
	FindAllPagination(page int, limit int, search string, sort string) ([]model.Products, int64, error)
	// Update memperbarui data produk di database.
	Update(product *model.Products) error
	// Delete menghapus data produk dari database berdasarkan ID.
	Delete(id uint) error
	// UpdateStock mengurangi stok produk saat transaksi terjadi.
	UpdateStock(tx *gorm.DB, productID uint, quantity int) error
}

// ProductRepositoryImpl merupakan implementasi dari ProductRepository menggunakan GORM.
type ProductRepositoryImpl struct {
	db *gorm.DB
}

// NewProductRepository membuat instance baru dari ProductRepository.
func NewProductRepository(db *gorm.DB) ProductRepository {
	return &ProductRepositoryImpl{db: db}
}

// Create menambahkan data produk baru ke database.
func (r *ProductRepositoryImpl) Create(product *model.Products) error {
	return r.db.Create(product).Error
}

// FindByID mengambil data produk berdasarkan ID.
func (r *ProductRepositoryImpl) FindByID(id uint) (model.Products, error) {
	var product model.Products
	err := r.db.Preload("Category").First(&product, id).Error
	return product, err
}

// FindAll mengambil seluruh data produk.
func (r *ProductRepositoryImpl) FindAll() ([]model.Products, error) {
	var products []model.Products
	err := r.db.Preload("Category").Find(&products).Error
	return products, err
}

// FindAllPagination mengambil list produk dengan paginasi, pencarian nama/SKU, dan pengurutan.
func (r *ProductRepositoryImpl) FindAllPagination(page int, limit int, search string, sort string) ([]model.Products, int64, error) {
	var products []model.Products
	var total int64

	query := r.db.Model(&model.Products{}).Preload("Category")

	if search != "" {
		query = query.Where("name ILIKE ? OR sku ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch sort {
	case "name_asc":
		query = query.Order("name ASC")
	case "name_desc":
		query = query.Order("name DESC")
	case "price_asc":
		query = query.Order("selling_price ASC")
	case "price_desc":
		query = query.Order("selling_price DESC")
	default:
		query = query.Order("created_at DESC")
	}

	err := query.Limit(limit).Offset((page - 1) * limit).Find(&products).Error

	return products, total, err
}

// Update memperbarui data produk di database.
func (r *ProductRepositoryImpl) Update(product *model.Products) error {
	return r.db.Save(product).Error
}

// Delete menghapus produk berdasarkan ID dari database.
func (r *ProductRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&model.Products{}, id).Error
}

// UpdateStock mengurangi jumlah stok produk (dapat menerima *gorm.DB session untuk transaksi).
func (r *ProductRepositoryImpl) UpdateStock(tx *gorm.DB, productID uint, quantity int) error {
	db := r.db
	if tx != nil {
		db = tx
	}
	return db.Model(&model.Products{}).Where("id = ?", productID).UpdateColumn("stock", gorm.Expr("stock - ?", quantity)).Error
}
