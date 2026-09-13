package handler

import (
	"net/http"
	"strconv"

	"wayrung/service"

	"github.com/gin-gonic/gin"
)

// ReportHandler mengelola request HTTP terkait laporan (agregasi transaksi & stok).
type ReportHandler struct {
	reportService service.ReportService
}

// NewReportHandler membuat instance baru dari ReportHandler.
func NewReportHandler(reportService service.ReportService) *ReportHandler {
	return &ReportHandler{reportService: reportService}
}

// GetSummary menangani GET /reports/summary?range=today|week|month
func (h *ReportHandler) GetSummary(c *gin.Context) {
	rangeStr := c.DefaultQuery("range", "week")

	summary, err := h.reportService.GetSummary(rangeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Ringkasan laporan berhasil diambil",
		"data":    summary,
	})
}

// GetSalesChart menangani GET /reports/sales-chart?range=today|week|month
func (h *ReportHandler) GetSalesChart(c *gin.Context) {
	rangeStr := c.DefaultQuery("range", "week")

	data, err := h.reportService.GetSalesChart(rangeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data grafik penjualan berhasil diambil",
		"data":    data,
	})
}

// GetTopProducts menangani GET /reports/top-products?range=today|week|month&limit=5
func (h *ReportHandler) GetTopProducts(c *gin.Context) {
	rangeStr := c.DefaultQuery("range", "week")

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "5"))
	if err != nil || limit <= 0 {
		limit = 5
	}

	data, err := h.reportService.GetTopProducts(rangeStr, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Produk terlaris berhasil diambil",
		"data":    data,
	})
}

// GetPaymentMethods menangani GET /reports/payment-methods?range=today|week|month
func (h *ReportHandler) GetPaymentMethods(c *gin.Context) {
	rangeStr := c.DefaultQuery("range", "week")

	data, err := h.reportService.GetPaymentMethods(rangeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data metode pembayaran berhasil diambil",
		"data":    data,
	})
}