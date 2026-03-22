package service

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"

	"github.com/nbb/blog-feedback/internal/model"
	"github.com/nbb/blog-feedback/internal/repository"
)

var (
	ErrAlreadyFeedback = errors.New("already submitted feedback for this post")
	ErrFeedbackNotFound = errors.New("feedback not found")
)

type FeedbackService struct {
	repo *repository.FeedbackRepository
}

func NewFeedbackService(repo *repository.FeedbackRepository) *FeedbackService {
	return &FeedbackService{repo: repo}
}

func (s *FeedbackService) CreateFeedback(req *model.CreateFeedbackRequest, ip string) error {
	ipHash := hashIP(ip)

	exists, err := s.repo.ExistsBySlugAndIPHash(req.Slug, ipHash)
	if err != nil {
		return err
	}
	if exists {
		return ErrAlreadyFeedback
	}

	feedback := &model.Feedback{
		Slug:    req.Slug,
		Type:    req.Type,
		Content: req.Content,
		IPHash:  ipHash,
	}

	return s.repo.Create(feedback)
}

func (s *FeedbackService) RevokeFeedback(req *model.RevokeFeedbackRequest, ip string) error {
	ipHash := hashIP(ip)

	exists, err := s.repo.ExistsBySlugAndIPHash(req.Slug, ipHash)
	if err != nil {
		return err
	}
	if !exists {
		return ErrFeedbackNotFound
	}

	return s.repo.DeleteBySlugAndIPHash(req.Slug, ipHash)
}

func hashIP(ip string) string {
	hash := sha256.Sum256([]byte(ip))
	return hex.EncodeToString(hash[:])
}

func (s *FeedbackService) GetHelpfulCount(slug string) (int64, error) {
	return s.repo.CountBySlug(slug)
}
