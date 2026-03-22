package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/nbb/blog-feedback/internal/handler"
	"github.com/nbb/blog-feedback/internal/model"
	"github.com/nbb/blog-feedback/internal/repository"
	"github.com/nbb/blog-feedback/internal/service"
	"github.com/nbb/blog-feedback/pkg/database"
)

var testServer *gin.Engine

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)

	cfg := database.Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "3306"),
		User:     getEnv("DB_USER", "root"),
		Password: getEnv("DB_PASSWORD", "root"),
		DBName:   getEnv("DB_NAME", "blog_feedback"),
	}

	db, err := database.NewMySQLDB(cfg)
	if err != nil {
		fmt.Printf("Failed to connect to database: %v\n", err)
		os.Exit(1)
	}

	// Clean up test data before running tests
	db.Exec("DELETE FROM feedbacks WHERE slug LIKE 'test-%'")

	repo := repository.NewFeedbackRepository(db)
	svc := service.NewFeedbackService(repo)
	h := handler.NewFeedbackHandler(svc)

	r := gin.New()
	api := r.Group("/api")
	{
		api.POST("/feedback", h.CreateFeedback)
		api.DELETE("/feedback", h.RevokeFeedback)
	}
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	testServer = r

	os.Exit(m.Run())
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func TestHealth(t *testing.T) {
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["status"] != "ok" {
		t.Errorf("Expected status 'ok', got '%s'", resp["status"])
	}
}

func TestCreateFeedback_Helpful(t *testing.T) {
	reqBody := model.CreateFeedbackRequest{
		Slug:  "test-helpful",
		Type:  model.FeedbackTypeHelpful,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.1:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp model.Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if !resp.Success {
		t.Errorf("Expected success=true, got false: %s", resp.Error)
	}
}

func TestCreateFeedback_NotHelpful(t *testing.T) {
	reqBody := model.CreateFeedbackRequest{
		Slug: "test-not-helpful",
		Type: model.FeedbackTypeNotHelpful,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.2:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp model.Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if !resp.Success {
		t.Errorf("Expected success=true, got false: %s", resp.Error)
	}
}

func TestCreateFeedback_OtherWithContent(t *testing.T) {
	reqBody := model.CreateFeedbackRequest{
		Slug:    "test-other",
		Type:    model.FeedbackTypeOther,
		Content: "This is my feedback content",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.3:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCreateFeedback_OtherWithoutContent(t *testing.T) {
	reqBody := model.CreateFeedbackRequest{
		Slug: "test-other-no-content",
		Type: model.FeedbackTypeOther,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.4:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestCreateFeedback_Duplicate(t *testing.T) {
	slug := "test-duplicate"

	// First submission
	reqBody := model.CreateFeedbackRequest{
		Slug: slug,
		Type: model.FeedbackTypeHelpful,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.5:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("First submission: expected status 200, got %d", w.Code)
	}

	// Duplicate submission from same IP
	req, _ = http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.5:12345"
	w = httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Duplicate submission: expected status 400, got %d", w.Code)
	}

	var resp model.Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error != "Already submitted feedback for this post" {
		t.Errorf("Expected error message about duplicate, got: %s", resp.Error)
	}
}

func TestCreateFeedback_MissingSlug(t *testing.T) {
	reqBody := map[string]string{
		"type": "helpful",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.6:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestCreateFeedback_InvalidType(t *testing.T) {
	reqBody := map[string]string{
		"slug": "test-invalid",
		"type": "invalid_type",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.7:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestRevokeFeedback_Success(t *testing.T) {
	slug := "test-revoke"

	// Create feedback first
	reqBody := model.CreateFeedbackRequest{
		Slug: slug,
		Type: model.FeedbackTypeHelpful,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.8:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Setup: failed to create feedback: %d", w.Code)
	}

	// Revoke feedback
	revokeBody := model.RevokeFeedbackRequest{Slug: slug}
	body, _ = json.Marshal(revokeBody)

	req, _ = http.NewRequest("DELETE", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.8:12345"
	w = httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp model.Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if !resp.Success {
		t.Errorf("Expected success=true, got false: %s", resp.Error)
	}
}

func TestRevokeFeedback_NotFound(t *testing.T) {
	revokeBody := model.RevokeFeedbackRequest{Slug: "non-existent-slug"}
	body, _ := json.Marshal(revokeBody)

	req, _ := http.NewRequest("DELETE", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.9:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}

	var resp model.Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error != "Feedback not found" {
		t.Errorf("Expected error 'Feedback not found', got: %s", resp.Error)
	}
}

func TestRevokeFeedback_MissingSlug(t *testing.T) {
	reqBody := map[string]string{}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("DELETE", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.10:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestRevokeFeedback_CanResubmit(t *testing.T) {
	slug := "test-resubmit"

	// Create feedback
	reqBody := model.CreateFeedbackRequest{
		Slug: slug,
		Type: model.FeedbackTypeHelpful,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.11:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	// Revoke feedback
	revokeBody := model.RevokeFeedbackRequest{Slug: slug}
	body, _ = json.Marshal(revokeBody)

	req, _ = http.NewRequest("DELETE", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.11:12345"
	w = httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	// Submit feedback again
	body, _ = json.Marshal(reqBody)
	req, _ = http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.11:12345"
	w = httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200 after resubmit, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCreateFeedback_DifferentIPCanSubmit(t *testing.T) {
	slug := "test-different-ip"

	// First IP submits
	reqBody := model.CreateFeedbackRequest{
		Slug: slug,
		Type: model.FeedbackTypeHelpful,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.20:12345"
	w := httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("First IP: failed to submit: %d", w.Code)
	}

	// Different IP submits for same slug
	req, _ = http.NewRequest("POST", "/api/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = "192.168.1.21:12345"
	w = httptest.NewRecorder()
	testServer.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Different IP: expected status 200, got %d: %s", w.Code, w.Body.String())
	}
}
