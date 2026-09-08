package handler

import (
	"net/http"
	"strconv"
	"wayrung/dto"
	"wayrung/service"

	"github.com/gin-gonic/gin"
)

// ProductHandler mengelola request HTTP terkait operasi data produk.
type ProductHandler struct {
	productService service.ProductService
}

// NewProductHandler membuat instance baru dari ProductHandler.
func NewProductHandler(productService service.ProductService) *ProductHandler {
	return &ProductHandler{productService: productService}
}

// Create menangani endpoint penambahan produk baru.
func (h *ProductHandler) Create(c *gin.Context) {
	var req dto.ProductCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.productService.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Produk berhasil ditambahkan",
		"data":    res,
	})
}

// FindAll menangani endpoint untuk mengambil daftar produk dengan paginasi dan pencarian.
func (h *ProductHandler) FindAll(c *gin.Context) {
	var query dto.ProductQueryRequest
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	products, total, err := h.productService.FindAll(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	limit := query.Limit
	if limit <= 0 {
		limit = 10
	}
	page := query.Page
	if page <= 0 {
		page = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data": products,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total_data": total,
		},
	})
}

// FindByID menangani endpoint untuk mengambil detail produk berdasarkan ID.
func (h *ProductHandler) FindByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID produk tidak valid"})
		return
	}

	res, err := h.productService.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}

// Update menangani pembaruan data produk.
func (h *ProductHandler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID produk tidak valid"})
		return
	}

	var req dto.ProductUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.productService.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Produk berhasil diperbarui",
		"data":    res,
	})
}

// Delete menangani penghapusan data produk berdasarkan ID.
func (h *ProductHandler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID produk tidak valid"})
		return
	}

	if err := h.productService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Produk berhasil dihapus"})
}
