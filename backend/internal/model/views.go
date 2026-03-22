package model

import (
	"time"
)

type ViewCount struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Slug       string    `gorm:"index;not null" json:"slug"`
	VisitorID  string    `gorm:"column:visitor_id;type:varchar(64);not null" json:"-"`
	IPHash     string    `gorm:"index;not null" json:"-"`
	ViewedAt   time.Time `gorm:"autoCreateTime" json:"viewed_at"`
}

func (ViewCount) TableName() string {
	return "view_counts"
}

type ViewCountResponse struct {
	Success bool   `json:"success"`
	Count   int64  `json:"count"`
	Error   string `json:"error,omitempty"`
}
