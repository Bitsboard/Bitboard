// Generate 2500 comprehensive listings across North America
const fs = require('fs');

// North American cities with coordinates
const cities = [
  { name: 'Toronto, ON, Canada', lat: 43.6532, lng: -79.3832, weight: 200 },
  { name: 'Vancouver, BC, Canada', lat: 49.2827, lng: -123.1207, weight: 150 },
  { name: 'Montreal, QC, Canada', lat: 45.5017, lng: -73.5673, weight: 120 },
  { name: 'Calgary, AB, Canada', lat: 51.0447, lng: -114.0719, weight: 80 },
  { name: 'Ottawa, ON, Canada', lat: 45.4215, lng: -75.6972, weight: 60 },
  
  { name: 'New York, NY, USA', lat: 40.7128, lng: -74.0060, weight: 300 },
  { name: 'Los Angeles, CA, USA', lat: 34.0522, lng: -118.2437, weight: 250 },
  { name: 'Chicago, IL, USA', lat: 41.8781, lng: -87.6298, weight: 200 },
  { name: 'Miami, FL, USA', lat: 25.7617, lng: -80.1918, weight: 180 },
  { name: 'San Francisco, CA, USA', lat: 37.7749, lng: -122.4194, weight: 220 },
  { name: 'Boston, MA, USA', lat: 42.3601, lng: -71.0589, weight: 150 },
  { name: 'Seattle, WA, USA', lat: 47.6062, lng: -122.3321, weight: 140 },
  { name: 'Austin, TX, USA', lat: 30.2672, lng: -97.7431, weight: 160 },
  { name: 'Denver, CO, USA', lat: 39.7392, lng: -104.9903, weight: 120 },
  { name: 'Las Vegas, NV, USA', lat: 36.1699, lng: -115.1398, weight: 100 },
  { name: 'Phoenix, AZ, USA', lat: 33.4484, lng: -112.0740, weight: 110 },
  { name: 'Portland, OR, USA', lat: 45.5152, lng: -122.6784, weight: 90 },
  { name: 'Nashville, TN, USA', lat: 36.1627, lng: -86.7816, weight: 80 },
  { name: 'Atlanta, GA, USA', lat: 33.7490, lng: -84.3880, weight: 130 },
  { name: 'Houston, TX, USA', lat: 29.7604, lng: -95.3698, weight: 140 },
  { name: 'Dallas, TX, USA', lat: 32.7767, lng: -96.7970, weight: 130 },
  { name: 'Philadelphia, PA, USA', lat: 39.9526, lng: -75.1652, weight: 120 },
  { name: 'San Diego, CA, USA', lat: 32.7157, lng: -117.1611, weight: 100 },
  { name: 'Detroit, MI, USA', lat: 42.3314, lng: -83.0458, weight: 80 },
  { name: 'Minneapolis, MN, USA', lat: 44.9778, lng: -93.2650, weight: 70 },
  { name: 'Orlando, FL, USA', lat: 28.5383, lng: -81.3792, weight: 60 },
  { name: 'Cleveland, OH, USA', lat: 41.4993, lng: -81.6944, weight: 50 },
  { name: 'Salt Lake City, UT, USA', lat: 40.7608, lng: -111.8910, weight: 70 },
  { name: 'Kansas City, MO, USA', lat: 39.0997, lng: -94.5786, weight: 50 },
  { name: 'Sacramento, CA, USA', lat: 38.5816, lng: -121.4944, weight: 60 }
];

// Categories and their typical items
const categories = [
  {
    name: 'Mining Gear',
    items: [
      'Antminer S19 Pro', 'Antminer S19j Pro', 'WhatsMiner M30S++', 'Antminer L7', 'AvalonMiner 1246',
      'Mining Container', 'ASIC Repair Service', 'Mining Hosting', 'Power Supply Units', 'Cooling Solutions',
      'Mining Farm Setup', 'Industrial Fans', 'Mining Shelving', 'Electrical Installation', 'Mining Monitoring'
    ]
  },
  {
    name: 'Electronics', 
    items: [
      'Hardware Wallet', 'Coldcard', 'Ledger Nano X', 'Trezor Model T', 'Gaming PC with Mining',
      'RTX 4090', 'RTX 4080', 'Tesla Model S', 'iPhone 15 Pro', 'MacBook Pro M3',
      'Bitcoin ATM', 'Point of Sale System', 'Mining Motherboard', 'SSD Storage', 'Server Equipment'
    ]
  },
  {
    name: 'Services',
    items: [
      'Bitcoin Programming Course', 'Crypto Tax Preparation', 'Mining Facility Design', 'Blockchain Development',
      'Security Audit', 'Lightning Network Setup', 'Bitcoin Education', 'Trading Course', 'Legal Services',
      'Marketing for Crypto', 'Node Hosting', 'Payment Gateway', 'Accounting Software', 'Consulting',
      'Investment Advisory'
    ]
  },
  {
    name: 'Office',
    items: [
      'Bitcoin Startup Office', 'Coworking Space', 'Conference Room', 'Event Venue', 'Meeting Room',
      'Crypto Incubator', 'Shared Workspace', 'Private Office', 'Trading Floor', 'Data Center Space',
      'Recording Studio', 'Broadcast Studio', 'Exhibition Space', 'Warehouse', 'Retail Space'
    ]
  },
  {
    name: 'Home & Garden',
    items: [
      'Bitcoin Mansion', 'Luxury Condo', 'Mining Ranch', 'Beach House', 'Mountain Cabin',
      'Smart Home Setup', 'Solar Panel Installation', 'Home Security System', 'Garden Design',
      'Pool Installation', 'Home Theater', 'Wine Cellar', 'Home Gym', 'Art Collection', 'Furniture'
    ]
  },
  {
    name: 'Games & Hobbies',
    items: [
      'Bitcoin Art Collection', 'Crypto Gaming Setup', 'NFT Collection', 'Trading Cards',
      'Collectible Coins', 'Art Gallery', 'Music Collection', 'Book Collection', 'Photography',
      'Vintage Items', 'Sports Cards', 'Board Games', 'Video Games', 'Musical Instruments', 'Hobbyist Items'
    ]
  },
  {
    name: 'Sports & Outdoors',
    items: [
      'Yacht Charter', 'Bitcoin Golf Tournament', 'Ski Equipment', 'Hiking Gear', 'Camping Equipment',
      'Bicycle', 'Motorcycle', 'Boat', 'RV', 'ATV', 'Fitness Equipment', 'Sports Tickets',
      'Gym Membership', 'Personal Training', 'Adventure Tours'
    ]
  }
];

// User IDs for posting
const userIds = Array.from({length: 100}, (_, i) => `na-user-${String(i + 1).padStart(3, '0')}`);

// Image URLs for different categories
const imageUrls = {
  'Mining Gear': 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400',
  'Electronics': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
  'Services': '',
  'Office': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400',
  'Home & Garden': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
  'Games & Hobbies': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
  'Sports & Outdoors': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400'
};

// Generate descriptions
function generateDescription(category, item) {
  const descriptions = {
    'Mining Gear': [
      'Professional grade mining equipment. Excellent condition with low operating hours.',
      'High-performance ASIC miner with optimal hash rate and energy efficiency.',
      'Industrial mining solution with complete setup and support included.',
      'Reliable mining hardware perfect for both home and commercial operations.',
      'Energy-efficient mining equipment with excellent return on investment.'
    ],
    'Electronics': [
      'Top-of-the-line electronics in pristine condition. All original accessories included.',
      'Latest technology with full warranty coverage and excellent performance.',
      'Professional grade equipment suitable for business and personal use.',
      'High-quality electronics with proven reliability and durability.',
      'State-of-the-art device with cutting-edge features and capabilities.'
    ],
    'Services': [
      'Professional service with years of experience and proven track record.',
      'Expert consultation and implementation with ongoing support included.',
      'Comprehensive service package designed for optimal results.',
      'Specialized expertise in cryptocurrency and blockchain technology.',
      'Full-service solution with transparent pricing and clear deliverables.'
    ],
    'Office': [
      'Prime commercial space in excellent location with modern amenities.',
      'Professional office environment perfect for growing businesses.',
      'Flexible workspace solution with networking opportunities.',
      'Modern facilities with high-speed internet and conference capabilities.',
      'Strategic location with easy access to transportation and services.'
    ],
    'Home & Garden': [
      'Luxury property with exceptional features and prime location.',
      'Beautiful home with modern amenities and stunning views.',
      'Exclusive property offering privacy and sophisticated living.',
      'Premium residence with exceptional design and quality finishes.',
      'Unique property with character and excellent investment potential.'
    ],
    'Games & Hobbies': [
      'Rare collectible item with certificate of authenticity and provenance.',
      'Unique piece perfect for collectors and enthusiasts.',
      'High-quality item with excellent condition and historical significance.',
      'Sought-after collectible with strong investment potential.',
      'Premium collectible item with verified authenticity and rarity.'
    ],
    'Sports & Outdoors': [
      'Premium outdoor equipment in excellent condition with minimal use.',
      'Professional-grade gear suitable for serious enthusiasts.',
      'High-quality equipment perfect for adventure and recreation.',
      'Reliable gear with proven performance in challenging conditions.',
      'Top-tier equipment designed for optimal outdoor experiences.'
    ]
  };
  
  const categoryDescriptions = descriptions[category] || descriptions['Services'];
  return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
}

// Generate price based on category and item
function generatePrice(category, item) {
  const priceRanges = {
    'Mining Gear': { min: 5000000, max: 800000000 }, // 0.05 - 8 BTC
    'Electronics': { min: 2000000, max: 200000000 }, // 0.02 - 2 BTC
    'Services': { min: 1000000, max: 150000000 }, // 0.01 - 1.5 BTC
    'Office': { min: 10000000, max: 500000000 }, // 0.1 - 5 BTC
    'Home & Garden': { min: 50000000, max: 2000000000 }, // 0.5 - 20 BTC
    'Games & Hobbies': { min: 1000000, max: 100000000 }, // 0.01 - 1 BTC
    'Sports & Outdoors': { min: 5000000, max: 300000000 } // 0.05 - 3 BTC
  };
  
  const range = priceRanges[category] || priceRanges['Services'];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

// Generate SQL for listings
function generateListings(count = 2500) {
  let sql = `-- Generated ${count} listings for North America
PRAGMA foreign_keys = OFF;

INSERT INTO listings (title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until, created_at, updated_at, status) VALUES\n`;

  const listings = [];
  
  for (let i = 0; i < count; i++) {
    // Weighted city selection
    const totalWeight = cities.reduce((sum, city) => sum + city.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    let selectedCity = cities[0];
    
    for (const city of cities) {
      randomWeight -= city.weight;
      if (randomWeight <= 0) {
        selectedCity = city;
        break;
      }
    }
    
    // Random category and item
    const category = categories[Math.floor(Math.random() * categories.length)];
    const item = category.items[Math.floor(Math.random() * category.items.length)];
    
    // Random user
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    
    // Random ad type (80% sell, 20% want)
    const adType = Math.random() < 0.8 ? 'sell' : 'want';
    
    // Random dates (within last 100 days)
    const daysAgo = Math.floor(Math.random() * 100) + 1;
    const createdAt = `strftime('%s','now') - (${daysAgo} * 24 * 60 * 60)`;
    
    // Boost (10% chance)
    const boosted = Math.random() < 0.1 ? `strftime('%s','now') + (${Math.floor(Math.random() * 30) + 1} * 24 * 60 * 60)` : 'NULL';
    
    // Generate listing
    const title = `${item}${Math.random() < 0.3 ? ' - ' + (['Excellent Condition', 'Like New', 'Professional Grade', 'Premium Quality', 'Rare Find'][Math.floor(Math.random() * 5)]) : ''}`;
    const description = generateDescription(category.name, item);
    const price = adType === 'want' && Math.random() < 0.3 ? 0 : generatePrice(category.name, item);
    const imageUrl = imageUrls[category.name] || '';
    
    // Add some location variance (within 50km of city center)
    const latVariance = (Math.random() - 0.5) * 0.9; // ~50km variance
    const lngVariance = (Math.random() - 0.5) * 0.9;
    const lat = selectedCity.lat + latVariance;
    const lng = selectedCity.lng + lngVariance;
    
    const listing = `('${title.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', '${category.name}', '${adType}', '${selectedCity.name}', ${lat.toFixed(4)}, ${lng.toFixed(4)}, '${imageUrl}', ${price}, '${userId}', ${boosted}, ${createdAt}, strftime('%s','now'), 'active')`;
    
    listings.push(listing);
  }
  
  sql += listings.join(',\n') + ';\n\nPRAGMA foreign_keys = ON;';
  
  return sql;
}

// Generate and save the SQL file
const sql = generateListings(2400); // Generate 2400 more to reach ~2500 total
fs.writeFileSync('d1/seed_large_listings.sql', sql);
console.log('Generated d1/seed_large_listings.sql with 2400 listings');
