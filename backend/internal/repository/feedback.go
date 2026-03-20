package repository

import (
	"github.com/nbb/blog-feedback/internal/model"

	"gorm.io/gorm"
)

type FeedbackRepository struct {
	db *gorm.DB
}

func NewFeedbackRepository(db *gorm.DB) *FeedbackRepository {
	return &FeedbackRepository{db: db}
}

func (r *FeedbackRepository) Create(feedback *model.Feedback) error {
	return r.db.Create(feedback).Error
}

func (r *FeedbackRepository) FindBySlugAndIPHash(slug, ipHash string) (*model.Feedback, error) {
	var feedback model.Feedback
	err := r.db.Where("slug = ? AND ip_hash = ?", slug, ipHash).First(&feedback).Error
	if err != nil {
		return nil, err
	}
	return &feedback, nil
}

func (r *FeedbackRepository) DeleteBySlugAndIPHash(slug, ipHash string) error {
	return r.db.Where("slug = ? AND ip_hash = ?", slug, ipHash).Delete(&model.Feedback{}).Error
}

func (r *FeedbackRepository) ExistsBySlugAndIPHash(slug, ipHash string) (bool, error) {
	var count int64
	err := r.db.Model(&model.Feedback{}).Where("slug = ? AND ip_hash = ?", slug, ipHash).Count(&count).Error
	return count > 0, err
}
