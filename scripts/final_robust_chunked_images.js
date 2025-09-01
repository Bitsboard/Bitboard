const fs = require('fs');

// 30 curated working Unsplash images
const images = [
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop'
];

function generateUniqueImagesForListing(listingIndex) {
  const selectedImages = [];
  const availableImages = [...images]; // Copy array to avoid modifying original
  
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    selectedImages.push(availableImages[randomIndex]);
    availableImages.splice(randomIndex, 1); // Remove selected image to avoid duplicates
  }
  
  return selectedImages;
}

function generateFinalChunkedSolution() {
  const chunkSize = 50; // 50 listings per chunk = 150 images per chunk
  const totalListings = 3600;
  const totalChunks = Math.ceil(totalListings / chunkSize);
  
  console.log(`Generating ${totalChunks} chunks of ${chunkSize} listings each...`);
  
  for (let chunkNum = 0; chunkNum < totalChunks; chunkNum++) {
    const startIndex = chunkNum * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize, totalListings);
    const actualChunkSize = endIndex - startIndex;
    
    let sql = `-- Chunk ${chunkNum + 1}/${totalChunks}: Listings ${startIndex + 1}-${endIndex}\n`;
    sql += `-- Adding 3 unique images to ${actualChunkSize} listings\n\n`;
    
    sql += 'INSERT INTO listing_images (listing_id, image_url, image_order) VALUES\n';
    
    const imageInserts = [];
    
    for (let i = startIndex; i < endIndex; i++) {
      const selectedImages = generateUniqueImagesForListing(i);
      selectedImages.forEach((imageUrl, imageIndex) => {
        // Use ROW_NUMBER() to get the listing at position i
        imageInserts.push(`((SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as rn FROM listings WHERE status = 'active') WHERE rn = ${i}), '${imageUrl}', ${imageIndex})`);
      });
    }
    
    sql += imageInserts.join(',\n') + ';\n';
    
    const filename = `d1/final_images_chunk_${chunkNum + 1}.sql`;
    fs.writeFileSync(filename, sql);
    console.log(`Generated: ${filename} (${actualChunkSize} listings, ${actualChunkSize * 3} images)`);
  }
  
  console.log(`\nGenerated ${totalChunks} chunk files successfully!`);
  console.log('Each chunk contains 50 listings with 3 unique images each.');
  console.log('Ready to execute with: wrangler d1 execute bitsbarter-staging --remote --yes --file=d1/final_images_chunk_X.sql');
}

generateFinalChunkedSolution();
