package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nbb/blog-feedback/internal/model"
	"github.com/nbb/blog-feedback/internal/service"
)

type ViewHandler struct {
	svc *service.ViewService
}

func NewViewHandler(svc *service.ViewService) *ViewHandler {
	return &ViewHandler{svc: svc}
}

type IncrementViewRequest struct {
	VisitorID string `json:"visitorId" binding:"required"`
}

func (h *ViewHandler) IncrementView(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, model.ViewCountResponse{
			Success: false,
			Error:   "Missing slug",
		})
		return
	}

	var req IncrementViewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ViewCountResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	ip := c.ClientIP()
	if err := h.svc.IncrementView(slug, req.VisitorID, ip); err != nil {
		c.JSON(http.StatusInternalServerError, model.ViewCountResponse{
			Success: false,
			Error:   "Failed to increment view",
		})
		return
	}

	c.JSON(http.StatusOK, model.ViewCountResponse{
		Success: true,
	})
}

func (h *ViewHandler) GetViewCount(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, model.ViewCountResponse{
			Success: false,
			Error:   "Missing slug",
		})
		return
	}

	count, err := h.svc.GetViewCount(slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ViewCountResponse{
			Success: false,
			Error:   "Failed to get view count",
		})
		return
	}

	c.JSON(http.StatusOK, model.ViewCountResponse{
		Success: true,
		Count:   count,
	})
}
