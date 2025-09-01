#!/bin/bash

echo "Starting fixed image chunk execution..."
echo "This will run all 72 chunks with proper image distribution"
echo ""

# Run all chunks 1-72
for i in {1..72}; do
    echo "Executing fixed chunk $i/72..."
    wrangler d1 execute bitsbarter-staging --remote --yes --file=d1/fixed_images_chunk_${i}.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Fixed chunk $i completed successfully"
    else
        echo "❌ Fixed chunk $i failed - stopping execution"
        exit 1
    fi
    
    # Small delay to avoid overwhelming the API
    sleep 1
done

echo ""
echo "🎉 All 72 fixed chunks completed successfully!"
echo "Total: 10,800 images added to 3,600 listings"
echo ""
echo "Running verification queries..."

# Run verification
wrangler d1 execute bitsbarter-staging --remote --command="SELECT COUNT(*) AS total_images FROM listing_images;"
wrangler d1 execute bitsbarter-staging --remote --command="SELECT COUNT(*) AS listings_with_3_images FROM listings WHERE (SELECT COUNT(*) FROM listing_images WHERE listing_id = listings.id) = 3;"
wrangler d1 execute bitsbarter-staging --remote --command="SELECT COUNT(DISTINCT image_url) AS unique_images FROM listing_images;"
