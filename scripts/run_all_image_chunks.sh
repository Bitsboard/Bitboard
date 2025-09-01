#!/bin/bash

echo "Starting automated image chunk execution..."
echo "This will run all 72 chunks to add images to 3600 listings"
echo ""

# Run chunks 4-72
for i in {4..72}; do
    echo "Executing chunk $i/72..."
    wrangler d1 execute bitsbarter-staging --remote --yes --file=d1/final_images_chunk_${i}.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Chunk $i completed successfully"
    else
        echo "❌ Chunk $i failed - stopping execution"
        exit 1
    fi
    
    # Small delay to avoid overwhelming the API
    sleep 1
done

echo ""
echo "🎉 All 72 chunks completed successfully!"
echo "Total: 10,800 images added to 3,600 listings"
echo ""
echo "Running verification query..."

# Run verification
wrangler d1 execute bitsbarter-staging --remote --command="SELECT COUNT(*) AS total_images FROM listing_images;"
wrangler d1 execute bitsbarter-staging --remote --command="SELECT COUNT(*) AS listings_with_3_images FROM listings WHERE (SELECT COUNT(*) FROM listing_images WHERE listing_id = listings.id) = 3;"
