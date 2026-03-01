# Timlyzer Makefile

.PHONY: all dev build run clean check lint help

# Default target
all: help

# Development
dev: ## Run development server (frontend + backend)
	pnpm tauri dev

dev-frontend: ## Run frontend only
	pnpm dev

# Build
build: ## Build the application for production
	pnpm tauri build

build-debug: ## Build in debug mode
	pnpm tauri build --debug

run: ## Build, kill old instance, and launch the app for quick testing
	pnpm tauri build
	-pkill -x Timlyzer 2>/dev/null; sleep 1
	open src-tauri/target/release/bundle/macos/Timlyzer.app

# Quality Checks
check: ## Check Rust code for errors
	cd src-tauri && cargo check

lint: ## Lint frontend and backend code
	pnpm lint
	cd src-tauri && cargo clippy

format: ## Format code
	pnpm format
	cd src-tauri && cargo fmt

# Clean
clean: ## Clean build artifacts
	rm -rf dist
	rm -rf src-tauri/target
	rm -rf node_modules

# Setup
setup: ## Install dependencies
	pnpm install
	cd src-tauri && cargo fetch

# Help
help: ## Display this help message
	@echo "Timlyzer Development Commands"
	@echo "============================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
