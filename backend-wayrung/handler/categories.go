package handler

import (
	"net/http"
	"strconv"
	"wayrung/dto"
	"wayrung/service"

	"github.com/gin-gonic/gin"
)

// CategoryHandler mengelola endpoint HTTP untuk data kategori produk.
type CategoryHandler struct {
	categoryService service.CategoryService
}

// NewCategoryHandler membuat instance baru dari CategoryHandler.
func NewCategoryHandler(categoryService service.CategoryService) *CategoryHandler {
	return &CategoryHandler{categoryService: categoryService}
}

// Create menangani endpoint pembuatan kategori produk baru.
func (h *CategoryHandler) Create(c *gin.Context) {
	var req dto.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.categoryService.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Kategori berhasil dibuat",
		"data":    res,
	})
}

// FindAll menangani endpoint untuk mengambil seluruh daftar kategori produk.
func (h *CategoryHandler) FindAll(c *gin.Context) {
	res, err := h.categoryService.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}

// FindByID menangani endpoint mengambil detail kategori produk berdasarkan ID.
func (h *CategoryHandler) FindByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID kategori tidak valid"})
		return
	}

	res, err := h.categoryService.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}

// Update menangani endpoint memperbarui nama kategori produk.
func (h *CategoryHandler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID kategori tidak valid"})
		return
	}

	var req dto.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.categoryService.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kategori berhasil diperbarui",
		"data":    res,
	})
}

// Delete menangani endpoint penghapusan kategori produk berdasarkan ID.
func (h *CategoryHandler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID kategori tidak valid"})
		return
	}

	if err := h.categoryService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil dihapus"})
}
