const fs = require('fs');

// 30 North American and European cities with coordinates
const cities = [
  { name: "New York, NY", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { name: "Toronto, ON", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver, BC", lat: 49.2827, lng: -123.1207 },
  { name: "Montreal, QC", lat: 45.5017, lng: -73.5673 },
  { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin, Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Madrid, Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Barcelona, Spain", lat: 41.3851, lng: 2.1734 },
  { name: "Milan, Italy", lat: 45.4642, lng: 9.1900 },
  { name: "Vienna, Austria", lat: 48.2082, lng: 16.3738 },
  { name: "Prague, Czech Republic", lat: 50.0755, lng: 14.4378 },
  { name: "Budapest, Hungary", lat: 47.4979, lng: 19.0402 },
  { name: "Warsaw, Poland", lat: 52.2297, lng: 21.0122 },
  { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Copenhagen, Denmark", lat: 55.6761, lng: 12.5683 },
  { name: "Oslo, Norway", lat: 59.9139, lng: 10.7522 },
  { name: "Helsinki, Finland", lat: 60.1699, lng: 24.9384 },
  { name: "Dublin, Ireland", lat: 53.3498, lng: -6.2603 },
  { name: "Brussels, Belgium", lat: 50.8503, lng: 4.3517 },
  { name: "Zurich, Switzerland", lat: 47.3769, lng: 8.5417 },
  { name: "Geneva, Switzerland", lat: 46.2044, lng: 6.1432 },
  { name: "Lyon, France", lat: 45.7578, lng: 4.8320 },
  { name: "Marseille, France", lat: 43.2965, lng: 5.3698 },
  { name: "Frankfurt, Germany", lat: 50.1109, lng: 8.6821 },
  { name: "Munich, Germany", lat: 48.1351, lng: 11.5820 },
  { name: "Hamburg, Germany", lat: 53.5511, lng: 9.9937 },
  { name: "Cologne, Germany", lat: 50.9375, lng: 6.9603 },
  { name: "Rotterdam, Netherlands", lat: 51.9225, lng: 4.4792 },
  { name: "The Hague, Netherlands", lat: 52.0705, lng: 4.3007 }
];

// 30 working Unsplash images
const images = [
  "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop"
];

// Items for listings
const items = [
  "iPhone", "MacBook", "iPad", "Samsung Galaxy", "PlayStation", "Xbox", "Nintendo Switch",
  "Bicycle", "Skateboard", "Tennis Racket", "Golf Clubs", "Soccer Ball", "Basketball",
  "Guitar", "Piano", "Drums", "Microphone", "Headphones", "Speaker", "Camera",
  "Drone", "Laptop", "Desktop PC", "Monitor", "Keyboard", "Mouse", "Tablet",
  "Smart Watch", "Fitness Tracker", "Bluetooth Speaker", "Wireless Earbuds"
];

const models = [
  "Pro", "Air", "Mini", "Ultra", "Elite", "Premium", "Standard", "Deluxe", "Classic", "Modern",
  "2023", "2024", "Series X", "Series S", "5G", "4K", "HD", "Wireless", "Bluetooth", "Smart"
];

const conditions = [
  "Like new", "Excellent", "Very good", "Good", "Fair", "Used", "Pre-owned", "Refurbished"
];

const categories = ["Electronics", "Home & Garden", "Sports & Outdoors", "Mining Gear"];

function generateRandomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateTitle() {
  const item = items[Math.floor(Math.random() * items.length)];
  const model = models[Math.floor(Math.random() * models.length)];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  return `${item} ${model} - ${condition} Condition`;
}

function generateDescription(title) {
  const descriptions = [
    `Selling my ${title.toLowerCase()}. In great condition, barely used. Perfect for anyone looking for quality at a reasonable price.`,
    `Looking to sell my ${title.toLowerCase()}. Works perfectly, no issues. Great deal for the right buyer.`,
    `Available: ${title.toLowerCase()}. Excellent condition, well maintained. Serious inquiries only please.`,
    `Selling ${title.toLowerCase()}. Good condition, comes with original packaging. Ready for immediate pickup.`,
    `Looking for a new home for my ${title.toLowerCase()}. In very good condition, no scratches or damage.`
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateRealisticPricing() {
  const basePrices = {
    "iPhone": 5000000, "MacBook": 15000000, "iPad": 8000000, "Samsung Galaxy": 4000000,
    "PlayStation": 6000000, "Xbox": 5000000, "Nintendo Switch": 3000000,
    "Bicycle": 2000000, "Skateboard": 800000, "Tennis Racket": 500000, "Golf Clubs": 3000000,
    "Soccer Ball": 200000, "Basketball": 150000, "Guitar": 4000000, "Piano": 20000000,
    "Drums": 8000000, "Microphone": 1000000, "Headphones": 2000000, "Speaker": 1500000,
    "Camera": 8000000, "Drone": 12000000, "Laptop": 12000000, "Desktop PC": 15000000,
    "Monitor": 5000000, "Keyboard": 800000, "Mouse": 300000, "Tablet": 6000000,
    "Smart Watch": 3000000, "Fitness Tracker": 1500000, "Bluetooth Speaker": 1000000, "Wireless Earbuds": 2000000
  };

  const item = items[Math.floor(Math.random() * items.length)];
  const basePrice = basePrices[item] || 5000000;
  
  // 60% fixed price, 40% make offer
  if (Math.random() < 0.6) {
    const variation = 0.7 + (Math.random() * 0.6); // 70% to 130% of base price
    return Math.floor(basePrice * variation);
  } else {
    return -1; // Make offer
  }
}

function generateSQL() {
  let sql = '-- Generate 100 more listings (201-300)\n\n';
  
  // Get existing user IDs
  sql += '-- Get user IDs for distribution\n';
  sql += 'WITH user_ids AS (SELECT id FROM users ORDER BY RANDOM() LIMIT 100)\n';
  
  // Insert listings
  sql += 'INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, created_at, updated_at, status, boosted_until, views) VALUES\n';
  
  const listings = [];
  for (let i = 201; i <= 300; i++) {
    const title = generateTitle();
    const description = generateDescription(title);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const adType = Math.random() < 0.7 ? 'sell' : 'want';
    const city = cities[Math.floor(Math.random() * cities.length)];
    const priceSat = generateRealisticPricing();
    const pricingType = priceSat === -1 ? 'make_offer' : 'fixed';
    const createdAt = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 31536000); // Random time in past year
    
    listings.push(`(
      '${generateRandomId()}',
      '${title.replace(/'/g, "''")}',
      '${description.replace(/'/g, "''")}',
      '${category}',
      '${adType}',
      '${city.name}',
      ${city.lat},
      ${city.lng},
      '${images[Math.floor(Math.random() * images.length)]}',
      ${priceSat},
      '${pricingType}',
      (SELECT id FROM user_ids LIMIT 1 OFFSET ${(i - 201) % 100}),
      ${createdAt},
      ${createdAt},
      'active',
      0,
      0
    )`);
  }
  
  sql += listings.join(',\n') + ';\n\n';
  
  // Insert images for each listing
  sql += '-- Insert images for listings\n';
  sql += 'INSERT INTO listing_images (listing_id, image_url, image_order) VALUES\n';
  
  const imageInserts = [];
  for (let i = 201; i <= 300; i++) {
    const listingId = `(SELECT id FROM listings ORDER BY created_at DESC LIMIT 1 OFFSET ${300 - i})`;
    
    // Select 3 different images for each listing
    const selectedImages = [];
    const availableImages = [...images]; // Copy array to avoid modifying original
    
    for (let j = 0; j < 3; j++) {
      const randomIndex = Math.floor(Math.random() * availableImages.length);
      selectedImages.push(availableImages[randomIndex]);
      availableImages.splice(randomIndex, 1); // Remove selected image to avoid duplicates
    }
    
    // Add the 3 different images for this listing
    selectedImages.forEach((imageUrl, index) => {
      imageInserts.push(`(${listingId}, '${imageUrl}', ${index})`);
    });
  }
  
  sql += imageInserts.join(',\n') + ';\n';
  
  return sql;
}

const sql = generateSQL();
fs.writeFileSync('d1/seed_listings_201_300.sql', sql);
console.log('Generated SQL for listings 201-300');
