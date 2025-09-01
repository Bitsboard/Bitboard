const https = require('https');

const images = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop'
];

function testImage(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      resolve({
        url,
        status: res.statusCode,
        working: res.statusCode === 200
      });
    });

    req.on('error', () => {
      resolve({
        url,
        status: 'ERROR',
        working: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        working: false
      });
    });

    req.end();
  });
}

async function testAllImages() {
  console.log('Testing all 13 unique images...\n');
  
  const results = [];
  for (const image of images) {
    const result = await testImage(image);
    results.push(result);
    console.log(`${result.working ? '✅' : '❌'} ${result.status} - ${image}`);
  }
  
  const workingImages = results.filter(r => r.working);
  const brokenImages = results.filter(r => !r.working);
  
  console.log(`\n📊 Results:`);
  console.log(`✅ Working: ${workingImages.length}`);
  console.log(`❌ Broken: ${brokenImages.length}`);
  
  if (brokenImages.length > 0) {
    console.log('\n🔧 Broken images that need to be replaced:');
    brokenImages.forEach(img => console.log(`   ${img.url}`));
  }
  
  return workingImages.map(img => img.url);
}

testAllImages().then(workingImages => {
  console.log(`\n🎯 ${workingImages.length} working images available for use.`);
});
