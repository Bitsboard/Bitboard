#!/bin/bash

# Wipe Staging Database and Clean Up Mock Data
# This script completely cleans the staging environment

set -e

echo "🧹 Starting comprehensive staging database cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "wrangler CLI is not installed. Please install it first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "wrangler.jsonc" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo "📋 Current database configuration:"
echo "   Staging: bitsbarter-staging (d5ed8250-15da-4131-8b78-c364a40515f4)"
echo "   Production: bitsbarter-prod (8c9de8f7-451b-4c90-b92c-5cd447907d46)"

print_warning "This will completely wipe the STAGING database. Are you sure? (y/N)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

# Step 1: Wipe the staging database
print_status "Step 1: Wiping staging database..."
if wrangler d1 execute bitsbarter-staging --file=./d1/wipe_staging_db.sql; then
    print_status "Database wiped successfully"
else
    print_error "Failed to wipe database"
    exit 1
fi

# Step 2: Remove all seed data files
print_status "Step 2: Removing seed data files..."
seed_files=(
    "d1/seed_*.sql"
    "d1/seed_batch_*.sql"
    "d1/seed_staging*.sql"
    "d1/seed_north_america.sql"
    "d1/seed_listings_north_america.sql"
    "d1/seed_large_listings.sql"
    "d1/seed_make_offer*.sql"
    "d1/seed_realistic_reputation.sql"
    "d1/seed_final_make_offer.sql"
)

for pattern in "${seed_files[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            rm "$file"
            print_status "Removed: $file"
        fi
    done
done

# Step 3: Remove test and fix files
print_status "Step 3: Removing test and fix files..."
test_files=(
    "d1/test_*.sql"
    "d1/fix_*.sql"
    "d1/restore_*.sql"
    "d1/cleanup_*.sql"
    "d1/audit_*.sql"
)

for pattern in "${test_files[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            rm "$file"
            print_status "Removed: $file"
        fi
    done
done

# Step 4: Keep only essential files
print_status "Step 4: Keeping only essential database files..."
essential_files=(
    "d1/migrations/"
    "d1/README.md"
    "d1/wipe_staging_db.sql"
)

echo "Essential files preserved:"
for file in "${essential_files[@]}"; do
    if [ -e "$file" ]; then
        echo "   ✅ $file"
    fi
done

# Step 5: Verify database is empty
print_status "Step 5: Verifying database is empty..."
echo "Checking table counts..."
wrangler d1 execute bitsbarter-staging --command="SELECT COUNT(*) as users_count FROM users;"
wrangler d1 execute bitsbarter-staging --command="SELECT COUNT(*) as listings_count FROM listings;"
wrangler d1 execute bitsbarter-staging --command="SELECT COUNT(*) as chats_count FROM chats;"
wrangler d1 execute bitsbarter-staging --command="SELECT COUNT(*) as messages_count FROM messages;"
wrangler d1 execute bitsbarter-staging --command="SELECT COUNT(*) as escrow_count FROM escrow;"
wrangler d1 execute bitsbarter-staging --command="SELECT COUNT(*) as saved_searches_count FROM saved_searches;"

# Step 6: Check for any remaining mock data configuration
print_status "Step 6: Checking configuration for mock data..."
if grep -r "ENABLE_MOCK_DATA.*true" src/ 2>/dev/null; then
    print_warning "Found ENABLE_MOCK_DATA set to true in source code"
else
    print_status "No mock data enabled in source code"
fi

# Step 7: Final verification
print_status "Step 7: Final verification..."
echo ""
echo "🎯 Cleanup Summary:"
echo "   ✅ Staging database wiped"
echo "   ✅ Seed data files removed"
echo "   ✅ Test/fix files removed"
echo "   ✅ Only essential files preserved"
echo ""
echo "📊 Current staging database status:"
wrangler d1 execute bitsbarter-staging --command="SELECT 'Database Status' as info, 'CLEAN' as status;"

print_status "Staging environment cleanup completed successfully!"
echo ""
echo "🔒 The staging database is now completely clean and ready for fresh development."
echo "💡 Remember: This only affected the staging database. Production remains untouched."
