package service

import (
	"crypto/sha256"
	"encoding/hex"
	"sync"
	"time"

	"github.com/nbb/blog-feedback/internal/model"
	"github.com/nbb/blog-feedback/internal/repository"
)

type ViewService struct {
	repo       *repository.ViewRepository
	cache      map[string]int64
	cacheMutex sync.RWMutex
}

func NewViewService(repo *repository.ViewRepository) *ViewService {
	svc := &ViewService{
		repo:  repo,
		cache: make(map[string]int64),
	}
	go svc.startCacheInvalidation()
	return svc
}

func (s *ViewService) startCacheInvalidation() {
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		s.cacheMutex.Lock()
		s.cache = make(map[string]int64)
		s.cacheMutex.Unlock()
	}
}

func (s *ViewService) IncrementView(slug, visitorId, ip string) error {
	ipHash := hashIPView(ip)

	exists, err := s.repo.ExistsBySlugVisitorIdDate(slug, visitorId, time.Now())
	if err != nil {
		return err
	}
	if exists {
		return nil
	}

	view := &model.ViewCount{
		Slug:      slug,
		VisitorID: visitorId,
		IPHash:    ipHash,
	}

	if err := s.repo.Create(view); err != nil {
		return err
	}

	s.cacheMutex.Lock()
	s.cache[slug]++
	s.cacheMutex.Unlock()

	return nil
}

func (s *ViewService) GetViewCount(slug string) (int64, error) {
	s.cacheMutex.RLock()
	if count, ok := s.cache[slug]; ok {
		s.cacheMutex.RUnlock()
		return count, nil
	}
	s.cacheMutex.RUnlock()

	count, err := s.repo.CountBySlug(slug)
	if err != nil {
		return 0, err
	}

	s.cacheMutex.Lock()
	s.cache[slug] = count
	s.cacheMutex.Unlock()

	return count, nil
}

func hashIPView(ip string) string {
	hash := sha256.Sum256([]byte(ip))
	return hex.EncodeToString(hash[:])
}
