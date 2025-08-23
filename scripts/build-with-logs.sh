#!/bin/bash

# Enhanced Cloudflare Pages Build Script with Comprehensive Logging
# This script captures all build logs for debugging purposes

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Timestamp for log files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="build-logs"
BUILD_LOG="$LOG_DIR/build_$TIMESTAMP.log"
ERROR_LOG="$LOG_DIR/errors_$TIMESTAMP.log"

# Create log directory
mkdir -p "$LOG_DIR"

echo -e "${BLUE}🚀 Starting Enhanced Cloudflare Pages Build${NC}"
echo -e "${BLUE}📅 Build started at: $(date)${NC}"
echo -e "${BLUE}📁 Logs will be saved to: $LOG_DIR${NC}"
echo -e "${BLUE}🔍 Verbose logging enabled${NC}"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BUILD_LOG"
}

# Function to log errors
log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$ERROR_LOG" "$BUILD_LOG"
}

# Function to log warnings
log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$BUILD_LOG"
}

# Function to log success
log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$BUILD_LOG"
}

# Function to log info
log_info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$BUILD_LOG"
}

# Log system information
log_info "=== SYSTEM INFORMATION ==="
log_info "Node.js version: $(node --version)"
log_info "npm version: $(npm --version)"
log_info "Git branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
log_info "Git commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
log_info "Working directory: $(pwd)"
log_info "Available memory: $(free -h 2>/dev/null | grep Mem | awk '{print $2}' || echo 'unknown')"

# Check for uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    log_warning "Uncommitted changes detected - this may affect build reproducibility"
    git status --short | tee -a "$BUILD_LOG"
fi

# Clean previous builds
log_info "=== CLEANING PREVIOUS BUILDS ==="
if [ -d ".next" ]; then
    log_info "Removing .next directory"
    rm -rf .next
fi

if [ -d ".vercel" ]; then
    log_info "Removing .vercel directory"
    rm -rf .vercel
fi

# Install dependencies if needed
log_info "=== CHECKING DEPENDENCIES ==="
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install 2>&1 | tee -a "$BUILD_LOG"
else
    log_info "Dependencies already installed"
fi

# Run linting
log_info "=== RUNNING LINTING ==="
if npm run lint 2>&1 | tee -a "$BUILD_LOG"; then
    log_success "Linting passed"
else
    log_warning "Linting had issues - continuing with build"
fi

# Run tests
log_info "=== RUNNING TESTS ==="
if npm test 2>&1 | tee -a "$BUILD_LOG"; then
    log_success "Tests passed"
else
    log_warning "Tests had issues - continuing with build"
fi

# Build Next.js
log_info "=== BUILDING NEXT.JS ==="
if npm run build 2>&1 | tee -a "$BUILD_LOG"; then
    log_success "Next.js build completed"
else
    log_error "Next.js build failed"
    exit 1
fi

# Build for Cloudflare Pages with verbose logging
log_info "=== BUILDING FOR CLOUDFLARE PAGES ==="
log_info "Starting Cloudflare Pages build with verbose logging..."

# Set environment variables for verbose logging
export DEBUG="*"
export NODE_ENV="production"
export CF_PAGES_BRANCH="${CF_PAGES_BRANCH:-staging}"

# Run Cloudflare build with comprehensive logging
if npm run build:cf:verbose 2>&1 | tee -a "$BUILD_LOG"; then
    log_success "Cloudflare Pages build completed"
else
    log_error "Cloudflare Pages build failed"
    exit 1
fi

# Verify build output
log_info "=== VERIFYING BUILD OUTPUT ==="
if [ -d ".vercel/output/static" ]; then
    log_success "Build output directory exists"
    log_info "Build output size: $(du -sh .vercel/output/static | cut -f1)"
    log_info "Number of files: $(find .vercel/output/static -type f | wc -l)"
    
    # List key build artifacts
    log_info "Key build artifacts:"
    ls -la .vercel/output/static/ | head -20 | tee -a "$BUILD_LOG"
    
    if [ -f ".vercel/output/static/_worker.js/index.js" ]; then
        log_success "Worker bundle exists"
        log_info "Worker bundle size: $(du -sh .vercel/output/static/_worker.js/index.js | cut -f1)"
    else
        log_warning "Worker bundle not found"
    fi
else
    log_error "Build output directory not found"
    exit 1
fi

# Generate build summary
log_info "=== BUILD SUMMARY ==="
log_success "Build completed successfully at $(date)"
log_info "Total build time: $(($(date +%s) - $(date -d "$TIMESTAMP" +%s))) seconds"
log_info "Build logs saved to: $BUILD_LOG"
if [ -f "$ERROR_LOG" ]; then
    log_warning "Errors logged to: $ERROR_LOG"
fi

# Create a symlink to the latest build log
ln -sf "$BUILD_LOG" "$LOG_DIR/latest_build.log"
ln -sf "$ERROR_LOG" "$LOG_DIR/latest_errors.log"

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${BLUE}📁 Logs saved to: $LOG_DIR${NC}"
echo -e "${BLUE}🔗 Latest build log: $LOG_DIR/latest_build.log${NC}"
echo -e "${BLUE}🚀 Ready to deploy to Cloudflare Pages${NC}"

# Optional: Deploy to Cloudflare Pages
if [ "$1" = "--deploy" ]; then
    log_info "=== DEPLOYING TO CLOUDFLARE PAGES ==="
    if wrangler pages deploy .vercel/output/static --project-name=bitboard 2>&1 | tee -a "$BUILD_LOG"; then
        log_success "Deployment completed successfully"
    else
        log_error "Deployment failed"
        exit 1
    fi
fi
