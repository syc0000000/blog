package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nbb/blog-feedback/internal/model"
	"github.com/nbb/blog-feedback/internal/service"
)

type FeedbackHandler struct {
	svc *service.FeedbackService
}

func NewFeedbackHandler(svc *service.FeedbackService) *FeedbackHandler {
	return &FeedbackHandler{svc: svc}
}

func (h *FeedbackHandler) CreateFeedback(c *gin.Context) {
	var req model.CreateFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.Response{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	if req.Type == model.FeedbackTypeOther && req.Content == "" {
		c.JSON(http.StatusBadRequest, model.Response{
			Success: false,
			Error:   "Content is required for 'other' feedback type",
		})
		return
	}

	ip := c.ClientIP()
	if err := h.svc.CreateFeedback(&req, ip); err != nil {
		if err == service.ErrAlreadyFeedback {
			c.JSON(http.StatusBadRequest, model.Response{
				Success: false,
				Error:   "Already submitted feedback for this post",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, model.Response{
			Success: false,
			Error:   "Failed to submit feedback",
		})
		return
	}

	c.JSON(http.StatusOK, model.Response{
		Success: true,
		Message: "Feedback submitted successfully",
	})
}

func (h *FeedbackHandler) RevokeFeedback(c *gin.Context) {
	var req model.RevokeFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.Response{
			Success: false,
			Error:   "Missing slug",
		})
		return
	}

	ip := c.ClientIP()
	if err := h.svc.RevokeFeedback(&req, ip); err != nil {
		if err == service.ErrFeedbackNotFound {
			c.JSON(http.StatusBadRequest, model.Response{
				Success: false,
				Error:   "Feedback not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, model.Response{
			Success: false,
			Error:   "Failed to revoke feedback",
		})
		return
	}

	c.JSON(http.StatusOK, model.Response{
		Success: true,
		Message: "Feedback revoked successfully",
	})
}
