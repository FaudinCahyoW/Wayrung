package service

import (
	"fmt"
	"wayrung/dto"
	"wayrung/model"
	"wayrung/repository"
)

// ProductService mendefinisikan interface layanan logika bisnis produk.
type ProductService interface {
	// Create menambahkan produk baru.
	Create(req dto.ProductCreateRequest) (dto.ProductResponse, error)
	// FindByID mengambil detail produk berdasarkan ID.
	FindByID(id uint) (dto.ProductResponse, error)
	// FindAll mengambil daftar produk berdasarkan parameter query.
	FindAll(req dto.ProductQueryRequest) ([]dto.ProductResponse, int64, error)
	// Update memperbarui data produk.
	Update(id uint, req dto.ProductUpdateRequest) (dto.ProductResponse, error)
	// Delete menghapus produk berdasarkan ID.
	Delete(id uint) error
}

// ProductServiceImpl merupakan implementasi dari ProductService.
type ProductServiceImpl struct {
	productRepo  repository.ProductRepository
	categoryRepo repository.CategoryRepository
}

// NewProductService membuat instance baru dari ProductService.
func NewProductService(productRepo repository.ProductRepository, categoryRepo repository.CategoryRepository) ProductService {
	return &ProductServiceImpl{
		productRepo:  productRepo,
		categoryRepo: categoryRepo,
	}
}

// Create memproses pembuatan produk baru setelah melakukan validasi kategori.
func (s *ProductServiceImpl) Create(req dto.ProductCreateRequest) (dto.ProductResponse, error) {
	if _, err := s.categoryRepo.FindByID(req.CategoryID); err != nil {
		return dto.ProductResponse{}, fmt.Errorf("kategori produk tidak ditemukan: %w", err)
	}

	product := model.Products{
		CategoryID:    req.CategoryID,
		Name:          req.Name,
		SKU:           req.SKU,
		PurchasePrice: req.PurchasePrice,
		SellingPrice:  req.SellingPrice,
		Stock:         req.Stock,
	}

	if err := s.productRepo.Create(&product); err != nil {
		return dto.ProductResponse{}, fmt.Errorf("gagal membuat produk: %w", err)
	}

	// Fetch full entity with preloaded category
	createdProduct, err := s.productRepo.FindByID(product.ID)
	if err != nil {
		return dto.ToProductResponse(product), nil
	}

	return dto.ToProductResponse(createdProduct), nil
}

// FindByID mengambil informasi detail produk berdasarkan ID.
func (s *ProductServiceImpl) FindByID(id uint) (dto.ProductResponse, error) {
	product, err := s.productRepo.FindByID(id)
	if err != nil {
		return dto.ProductResponse{}, fmt.Errorf("produk tidak ditemukan: %w", err)
	}
	return dto.ToProductResponse(product), nil
}

// FindAll mengambil daftar produk dengan dukungan pencarian dan pagination.
func (s *ProductServiceImpl) FindAll(req dto.ProductQueryRequest) ([]dto.ProductResponse, int64, error) {
	limit := req.Limit
	if limit <= 0 {
		limit = 10
	}
	page := req.Page
	if page <= 0 {
		page = 1
	}

	products, total, err := s.productRepo.FindAllPagination(page, limit, req.Search, req.Sort)
	if err != nil {
		return nil, 0, fmt.Errorf("gagal mengambil daftar produk: %w", err)
	}

	return dto.ToProductResponseList(products), total, nil
}

// Update memperbarui informasi produk yang sudah ada.
func (s *ProductServiceImpl) Update(id uint, req dto.ProductUpdateRequest) (dto.ProductResponse, error) {
	product, err := s.productRepo.FindByID(id)
	if err != nil {
		return dto.ProductResponse{}, fmt.Errorf("produk tidak ditemukan: %w", err)
	}

	if _, err := s.categoryRepo.FindByID(req.CategoryID); err != nil {
		return dto.ProductResponse{}, fmt.Errorf("kategori produk tidak ditemukan: %w", err)
	}

	product.CategoryID = req.CategoryID
	product.Name = req.Name
	product.SKU = req.SKU
	product.PurchasePrice = req.PurchasePrice
	product.SellingPrice = req.SellingPrice
	product.Stock = req.Stock

	if err := s.productRepo.Update(&product); err != nil {
		return dto.ProductResponse{}, fmt.Errorf("gagal memperbarui produk: %w", err)
	}

	updatedProduct, err := s.productRepo.FindByID(product.ID)
	if err != nil {
		return dto.ToProductResponse(product), nil
	}

	return dto.ToProductResponse(updatedProduct), nil
}

// Delete menghapus data produk berdasarkan ID.
func (s *ProductServiceImpl) Delete(id uint) error {
	if _, err := s.productRepo.FindByID(id); err != nil {
		return fmt.Errorf("produk tidak ditemukan: %w", err)
	}

	if err := s.productRepo.Delete(id); err != nil {
		return fmt.Errorf("gagal menghapus produk: %w", err)
	}
	return nil
}
