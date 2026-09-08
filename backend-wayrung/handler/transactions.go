package handler

import (
	"net/http"
	"strconv"
	"wayrung/dto"
	"wayrung/service"

	"github.com/gin-gonic/gin"
)

// TransactionHandler mengelola endpoint HTTP untuk transaksi penjualan/pembelian.
type TransactionHandler struct {
	txService service.TransactionService
}

// NewTransactionHandler membuat instance baru dari TransactionHandler.
func NewTransactionHandler(txService service.TransactionService) *TransactionHandler {
	return &TransactionHandler{txService: txService}
}

// Create menangani pemrosesan transaksi baru (diambil user_id dari context middleware JWT).
func (h *TransactionHandler) Create(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Pengguna belum terautentikasi"})
		return
	}
	userID := userIDVal.(uint)

	var req dto.TransactionCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.txService.CreateTransaction(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Transaksi berhasil diproses",
		"data":    res,
	})
}

// FindAll menangani pengambilan seluruh data riwayat transaksi.
func (h *TransactionHandler) FindAll(c *gin.Context) {
	userRoleVal, _ := c.Get("role")
	userRole := ""
	if userRoleVal != nil {
		userRole = userRoleVal.(string)
	}

	// Jika role kasir, hanya tampilkan transaksi milik kasir tersebut
	if userRole == "kasir" {
		userIDVal, _ := c.Get("user_id")
		userID := userIDVal.(uint)
		res, err := h.txService.FindByUserID(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": res})
		return
	}

	res, err := h.txService.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}

// FindByID menangani rincian detail transaksi berdasarkan ID.
func (h *TransactionHandler) FindByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID transaksi tidak valid"})
		return
	}

	res, err := h.txService.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}
