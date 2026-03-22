package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/nbb/blog-feedback/internal/handler"
	"github.com/nbb/blog-feedback/internal/repository"
	"github.com/nbb/blog-feedback/internal/service"
	"github.com/nbb/blog-feedback/pkg/database"
)

func main() {
	cfg := database.Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "3306"),
		User:     getEnv("DB_USER", "root"),
		Password: getEnv("DB_PASSWORD", "root"),
		DBName:   getEnv("DB_NAME", "blog_feedback"),
	}

	db, err := database.NewMySQLDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	repo := repository.NewFeedbackRepository(db)
	svc := service.NewFeedbackService(repo)
	h := handler.NewFeedbackHandler(svc)

	r := gin.Default()

	api := r.Group("/api")
	{
		api.POST("/feedback", h.CreateFeedback)
		api.DELETE("/feedback", h.RevokeFeedback)
		api.GET("/feedback/:slug/count", h.GetHelpfulCount)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
