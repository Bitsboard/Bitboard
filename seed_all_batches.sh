#!/bin/bash

# Execute all batch files sequentially to seed the staging database
echo "Starting batch seeding of 2400 listings..."

for i in {01..24}; do
  echo "Executing batch $i..."
  wrangler d1 execute bitsbarter-staging --remote --file=d1/seed_batch_${i}.sql
  
  if [ $? -eq 0 ]; then
    echo "Batch $i completed successfully"
  else
    echo "Batch $i failed, stopping"
    exit 1
  fi
  
  # Small delay between batches
  sleep 2
done

echo "All batches completed! 2400 listings have been seeded."
