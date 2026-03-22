package repository

import (
	"time"

	"github.com/nbb/blog-feedback/internal/model"

	"gorm.io/gorm"
)

type ViewRepository struct {
	db *gorm.DB
}

func NewViewRepository(db *gorm.DB) *ViewRepository {
	return &ViewRepository{db: db}
}

func (r *ViewRepository) Create(view *model.ViewCount) error {
	return r.db.Create(view).Error
}

func (r *ViewRepository) ExistsBySlugVisitorIdDate(slug, visitorId string, date time.Time) (bool, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	var count int64
	err := r.db.Model(&model.ViewCount{}).
		Where("slug = ? AND visitor_id = ? AND viewed_at >= ? AND viewed_at < ?",
			slug, visitorId, startOfDay, endOfDay).
		Count(&count).Error
	return count > 0, err
}

func (r *ViewRepository) CountBySlug(slug string) (int64, error) {
	var count int64
	err := r.db.Model(&model.ViewCount{}).Where("slug = ?", slug).Count(&count).Error
	return count, err
}
