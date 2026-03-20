.PHONY: build run test clean migrate

# Build the binary
build:
	go build -o bin/server ./cmd/server

# Run the server
run:
	go run ./cmd/server

# Run tests
test:
	go test ./...

# Clean build artifacts
clean:
	rm -rf bin/

# Download dependencies
deps:
	go mod download
	go mod tidy

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Run database migration (requires psql)
migrate:
	psql -h $(DB_HOST) -U $(DB_USER) -d $(DB_NAME) -f migrations/001_create_feedbacks.sql
