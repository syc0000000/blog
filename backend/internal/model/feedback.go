package model

import (
	"time"
)

type FeedbackType string

const (
	FeedbackTypeHelpful    FeedbackType = "helpful"
	FeedbackTypeNotHelpful FeedbackType = "not_helpful"
	FeedbackTypeOther      FeedbackType = "other"
)

type Feedback struct {
	ID        uint          `gorm:"primaryKey" json:"id"`
	Slug      string        `gorm:"index;not null" json:"slug"`
	Type      FeedbackType  `gorm:"type:varchar(20);not null" json:"type"`
	Content   string        `gorm:"type:text" json:"content"`
	IPHash    string        `gorm:"index;not null" json:"-"`
	CreatedAt time.Time     `json:"created_at"`
}

func (Feedback) TableName() string {
	return "feedbacks"
}

type CreateFeedbackRequest struct {
	Slug    string       `json:"slug" binding:"required"`
	Type    FeedbackType `json:"type" binding:"required,oneof=helpful not_helpful other"`
	Content string       `json:"content"`
}

type RevokeFeedbackRequest struct {
	Slug string `json:"slug" binding:"required"`
}

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}
