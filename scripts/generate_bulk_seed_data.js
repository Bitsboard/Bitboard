#!/usr/bin/env node

/**
 * Bulk Seed Data Generator for Staging Database
 * Generates 200 users and 2000 listings with realistic data
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TARGET_USERS = 200;
const TARGET_LISTINGS = 2000;
const CURRENT_USERS = 15;
const CURRENT_LISTINGS = 15;

// Data templates
const USER_TEMPLATES = [
  { prefix: 'Tech', suffix: 'Developer', domain: 'tech.com' },
  { prefix: 'Crypto', suffix: 'Trader', domain: 'crypto.com' },
  { prefix: 'Mining', suffix: 'Expert', domain: 'mining.com' },
  { prefix: 'Digital', suffix: 'Artist', domain: 'digital.com' },
  { prefix: 'Web', suffix: 'Designer', domain: 'webdesign.com' },
  { prefix: 'Blockchain', suffix: 'Developer', domain: 'blockchain.com' },
  { prefix: 'Gaming', suffix: 'Streamer', domain: 'gaming.com' },
  { prefix: 'Finance', suffix: 'Advisor', domain: 'finance.com' },
  { prefix: 'Creative', suffix: 'Freelancer', domain: 'creative.com' },
  { prefix: 'Innovation', suffix: 'Consultant', domain: 'innovation.com' }
];

const LISTING_TEMPLATES = [
  // Mining Gear
  { title: 'Antminer S{model} Pro {hashrate}TH/s Bitcoin Miner', category: 'Mining Gear', basePrice: 2000000, priceRange: 3000000 },
  { title: 'GPU Mining Rig - {gpuCount}x RTX {gpuModel}', category: 'Mining Gear', basePrice: 1500000, priceRange: 2500000 },
  { title: 'ASIC Miner Hosting Service - {location}', category: 'Mining Gear', basePrice: 500000, priceRange: 1000000 },
  
  // Electronics
  { title: 'MacBook Pro M{chip} {size}" {storage}GB', category: 'Electronics', basePrice: 2500000, priceRange: 4000000 },
  { title: 'iPhone {model} Pro Max {storage}GB', category: 'Electronics', basePrice: 2000000, priceRange: 3000000 },
  { title: 'Gaming PC RTX {gpu} {cpu} {ram}GB RAM', category: 'Electronics', basePrice: 3000000, priceRange: 5000000 },
  { title: 'iPad Pro {size}" M{chip} {storage}GB', category: 'Electronics', basePrice: 1500000, priceRange: 2500000 },
  { title: 'Sony A7 {model} Camera Kit with Lenses', category: 'Electronics', basePrice: 3000000, priceRange: 4500000 },
  
  // Services
  { title: 'Web Development Services - {tech}', category: 'Services', basePrice: 500000, priceRange: 1500000 },
  { title: 'Bitcoin Mining Consultation - {experience} Years', category: 'Services', basePrice: 200000, priceRange: 800000 },
  { title: 'Crypto Tax Preparation Services', category: 'Services', basePrice: 150000, priceRange: 500000 },
  { title: 'Graphic Design Services - {specialty}', category: 'Services', basePrice: 300000, priceRange: 1000000 },
  { title: 'Social Media Management - {platforms}', category: 'Services', basePrice: 250000, priceRange: 800000 },
  
  // Home & Garden
  { title: 'Smart Home Security System - {features}', category: 'Home & Garden', basePrice: 800000, priceRange: 2000000 },
  { title: 'Garden Tools Collection - Professional Grade', category: 'Home & Garden', basePrice: 100000, priceRange: 500000 },
  { title: 'Patio Furniture Set - {material} {style}', category: 'Home & Garden', basePrice: 500000, priceRange: 1500000 },
  
  // Office
  { title: 'Office Furniture Set - {style} {material}', category: 'Office', basePrice: 400000, priceRange: 1200000 },
  { title: 'Professional Desk Setup - {size} {features}', category: 'Office', basePrice: 300000, priceRange: 1000000 },
  
  // Sports & Outdoors
  { title: 'Sports Equipment - {sport} {level}', category: 'Sports & Outdoors', basePrice: 200000, priceRange: 800000 },
  { title: 'Outdoor Gear Collection - {season} {activity}', category: 'Sports & Outdoors', basePrice: 150000, priceRange: 600000 },
  
  // Games & Hobbies
  { title: 'Gaming Collection - {genre} {platform}', category: 'Games & Hobbies', basePrice: 100000, priceRange: 500000 },
  { title: 'Collectibles - {category} {rarity}', category: 'Games & Hobbies', basePrice: 50000, priceRange: 300000 }
];

const LOCATIONS = [
  { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { city: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
  { city: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
  { city: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { city: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
  { city: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.2650 }
];

// Utility functions
function generateRandomId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomEmail(username) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'protonmail.com', 'icloud.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username.toLowerCase()}@${domain}`;
}

function generateRandomImage(type = 'listing') {
  const baseId = 1500000000 + Math.floor(Math.random() * 100000000);
  const size = type === 'profile' ? 'w=150&h=150&fit=crop&crop=face' : 'w=400&h=300&fit=crop';
  return `https://images.unsplash.com/photo-${baseId}?${size}`;
}

function generateRandomTimestamp(daysAgo = 90) {
  const now = Math.floor(Date.now() / 1000);
  const daysInSeconds = daysAgo * 24 * 60 * 60;
  return now - Math.floor(Math.random() * daysInSeconds);
}

function generateRandomPrice(basePrice, range) {
  const min = basePrice * 0.7;
  const max = basePrice + range;
  return Math.floor(Math.random() * (max - min) + min);
}

function generateUserData(index) {
  const template = USER_TEMPLATES[index % USER_TEMPLATES.length];
  const username = `${template.prefix}${template.suffix}${index + 1}`;
  
  return {
    id: generateRandomId(8),
    email: generateRandomEmail(username),
    username: username,
    sso: ['google', 'apple', 'facebook'][Math.floor(Math.random() * 3)],
    verified: Math.random() > 0.1 ? 1 : 0,
    is_admin: 0,
    banned: 0,
    created_at: generateRandomTimestamp(365),
    image: generateRandomImage('profile'),
    thumbs_up: Math.floor(Math.random() * 100),
    deals: Math.floor(Math.random() * 50),
    last_active: generateRandomTimestamp(30),
    has_chosen_username: 1,
    balance: Math.floor(Math.random() * 10000000)
  };
}

function generateListingData(index) {
  const template = LISTING_TEMPLATES[index % LISTING_TEMPLATES.length];
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  
  // Generate dynamic title
  let title = template.title;
  title = title.replace('{model}', 19 + Math.floor(Math.random() * 3));
  title = title.replace('{hashrate}', 100 + Math.floor(Math.random() * 50));
  title = title.replace('{gpuCount}', 4 + Math.floor(Math.random() * 6));
  title = title.replace('{gpuModel}', 3060 + Math.floor(Math.random() * 5) * 10);
  title = title.replace('{location}', location.city);
  title = title.replace('{chip}', 1 + Math.floor(Math.random() * 3));
  title = title.replace('{size}', 13 + Math.floor(Math.random() * 4));
  title = title.replace('{storage}', [128, 256, 512, 1024][Math.floor(Math.random() * 4)]);
  title = title.replace('{gpu}', 3060 + Math.floor(Math.random() * 5) * 10);
  title = title.replace('{cpu}', ['Intel i7', 'AMD Ryzen 7', 'Intel i9', 'AMD Ryzen 9'][Math.floor(Math.random() * 4)]);
  title = title.replace('{ram}', [16, 32, 64][Math.floor(Math.random() * 3)]);
  title = title.replace('{tech}', ['React', 'Node.js', 'Python', 'Vue.js', 'Angular'][Math.floor(Math.random() * 3)]);
  title = title.replace('{experience}', 5 + Math.floor(Math.random() * 15));
  title = title.replace('{specialty}', ['Logos', 'Web Design', 'Branding', 'Print'][Math.floor(Math.random() * 3)]);
  title = title.replace('{platforms}', ['Instagram', 'Facebook', 'Twitter', 'LinkedIn'][Math.floor(Math.random() * 3)]);
  title = title.replace('{features}', ['4K Cameras', 'Motion Sensors', 'Mobile App', 'AI Detection'][Math.floor(Math.random() * 3)]);
  title = title.replace('{material}', ['Wood', 'Metal', 'Plastic', 'Glass'][Math.floor(Math.random() * 3)]);
  title = title.replace('{style}', ['Modern', 'Classic', 'Contemporary', 'Rustic'][Math.floor(Math.random() * 3)]);
  title = title.replace('{sport}', ['Basketball', 'Football', 'Soccer', 'Tennis', 'Golf'][Math.floor(Math.random() * 3)]);
  title = title.replace('{level}', ['Beginner', 'Intermediate', 'Professional'][Math.floor(Math.random() * 3)]);
  title = title.replace('{season}', ['Spring', 'Summer', 'Fall', 'Winter'][Math.floor(Math.random() * 3)]);
  title = title.replace('{activity}', ['Hiking', 'Camping', 'Fishing', 'Cycling'][Math.floor(Math.random() * 3)]);
  title = title.replace('{genre}', ['RPG', 'FPS', 'Strategy', 'Adventure'][Math.floor(Math.random() * 3)]);
  title = title.replace('{platform}', ['PC', 'PlayStation', 'Xbox', 'Nintendo'][Math.floor(Math.random() * 3)]);
  title = title.replace('{category}', ['Gaming', 'Sports', 'Entertainment', 'Comics'][Math.floor(Math.random() * 3)]);
  title = title.replace('{rarity}', ['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 3)]);
  
  const description = `High-quality item in excellent condition. Perfect for ${['beginners', 'professionals', 'enthusiasts'][Math.floor(Math.random() * 3)]}. Includes all accessories and documentation. ${Math.random() > 0.5 ? 'Great value for money.' : 'Rare find, don\'t miss out!'}`;
  
  return {
    title: title,
    description: description,
    category: template.category,
    ad_type: Math.random() > 0.2 ? 'sell' : 'want',
    location: `${location.city}, ${location.state}`,
    lat: location.lat + (Math.random() - 0.5) * 0.1,
    lng: location.lng + (Math.random() - 0.5) * 0.1,
    image_url: generateRandomImage('listing'),
    price_sat: generateRandomPrice(template.basePrice, template.priceRange),
    pricing_type: Math.random() > 0.5 ? 'fixed' : 'make_offer',
    posted_by: `USER_ID_${Math.floor(Math.random() * TARGET_USERS) + 1}`, // Will be replaced with actual user IDs
    boosted_until: Math.random() > 0.9 ? generateRandomTimestamp(-14) : null,
    created_at: generateRandomTimestamp(90),
    updated_at: generateRandomTimestamp(30),
    status: Math.random() > 0.9 ? ['sold', 'expired'][Math.floor(Math.random() * 2)] : 'active',
    views: Math.floor(Math.random() * 500)
  };
}

function generateImageData(listingId, imageCount = 3) {
  const images = [];
  for (let i = 1; i <= imageCount; i++) {
    images.push({
      id: `img${String(listingId).padStart(6, '0')}_${i}`,
      listing_id: listingId,
      image_url: generateRandomImage('listing'),
      image_order: i,
      created_at: Math.floor(Date.now() / 1000)
    });
  }
  return images;
}

function generateViewLogData(listingId, viewCount = 3) {
  const views = [];
  for (let i = 1; i <= viewCount; i++) {
    views.push({
      id: `view${String(listingId).padStart(6, '0')}_${i}`,
      listing_id: listingId,
      viewer_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      viewer_session: `session_${Math.random().toString(36).substring(2, 8)}`,
      viewed_at: generateRandomTimestamp(30)
    });
  }
  return views;
}

function generateSQLFile() {
  let sql = `-- Bulk Seed Data Generated by Node.js Script
-- Generated on: ${new Date().toISOString()}
-- Target: ${TARGET_USERS} users, ${TARGET_LISTINGS} listings

PRAGMA foreign_keys = OFF;

-- ============================================================================
-- GENERATE REMAINING ${TARGET_USERS - CURRENT_USERS} USERS
-- ============================================================================

`;

  // Generate users
  for (let i = CURRENT_USERS; i < TARGET_USERS; i++) {
    const user = generateUserData(i);
    sql += `INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('${user.id}', '${user.email}', '${user.username}', '${user.sso}', ${user.verified}, ${user.is_admin}, ${user.banned}, ${user.created_at}, '${user.image}', ${user.thumbs_up}, ${user.deals}, ${user.last_active}, ${user.has_chosen_username}, ${user.balance});

`;
  }

  sql += `-- ============================================================================
-- GENERATE REMAINING ${TARGET_LISTINGS - CURRENT_LISTINGS} LISTINGS
-- ============================================================================

`;

  // Generate listings
  for (let i = CURRENT_LISTINGS; i < TARGET_LISTINGS; i++) {
    const listing = generateListingData(i);
    sql += `INSERT INTO listings (title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
('${listing.title.replace(/'/g, "''")}', '${listing.description.replace(/'/g, "''")}', '${listing.category}', '${listing.ad_type}', '${listing.location}', ${listing.lat}, ${listing.lng}, '${listing.image_url}', ${listing.price_sat}, '${listing.pricing_type}', '${listing.posted_by}', ${listing.boosted_until || 'NULL'}, ${listing.created_at}, ${listing.updated_at}, '${listing.status}', ${listing.views});

`;
  }

  sql += `-- ============================================================================
-- GENERATE LISTING IMAGES (3 per listing)
-- ============================================================================

`;

  // Generate images for all listings
  for (let i = 1; i <= TARGET_LISTINGS; i++) {
    const images = generateImageData(i);
    images.forEach(image => {
      sql += `INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('${image.id}', ${image.listing_id}, '${image.image_url}', ${image.image_order}, ${image.created_at});

`;
    });
  }

  sql += `-- ============================================================================
-- GENERATE VIEW LOGS (3 per listing)
-- ============================================================================

`;

  // Generate view logs for all listings
  for (let i = 1; i <= TARGET_LISTINGS; i++) {
    const views = generateViewLogData(i);
    views.forEach(view => {
      sql += `INSERT INTO view_logs (id, listing_id, viewer_ip, viewer_session, viewed_at) VALUES
('${view.id}', ${view.listing_id}, '${view.viewer_ip}', '${view.viewer_session}', ${view.viewed_at});

`;
    });
  }

  sql += `PRAGMA foreign_keys = ON;

-- Display final results
SELECT 'BULK SEEDING COMPLETED' as status;
SELECT 'Total users: ${TARGET_USERS}' as users_total;
SELECT 'Total listings: ${TARGET_LISTINGS}' as listings_total;
SELECT 'Total images: ${TARGET_LISTINGS * 3}' as images_total;
SELECT 'Total view logs: ${TARGET_LISTINGS * 3}' as view_logs_total;
`;

  return sql;
}

// Main execution
function main() {
  console.log('🚀 Generating bulk seed data...');
  console.log(`📊 Target: ${TARGET_USERS} users, ${TARGET_LISTINGS} listings`);
  console.log(`📈 Current: ${CURRENT_USERS} users, ${CURRENT_LISTINGS} listings`);
  console.log(`🎯 Need to generate: ${TARGET_USERS - CURRENT_USERS} users, ${TARGET_LISTINGS - CURRENT_LISTINGS} listings`);

  try {
    const sql = generateSQLFile();
    const outputPath = path.join(__dirname, '..', 'd1', 'bulk_seed_generated.sql');
    
    fs.writeFileSync(outputPath, sql);
    
    console.log('✅ SQL file generated successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📏 File size: ${(sql.length / 1024).toFixed(2)} KB`);
    console.log('');
    console.log('🔧 Next steps:');
    console.log(`   1. Review the generated SQL file`);
    console.log(`   2. Run: wrangler d1 execute bitsbarter-staging --file=./d1/bulk_seed_generated.sql`);
    console.log(`   3. Verify the data was inserted correctly`);
    
  } catch (error) {
    console.error('❌ Error generating SQL file:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateUserData,
  generateListingData,
  generateImageData,
  generateViewLogData,
  generateSQLFile
};
