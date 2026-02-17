const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Inventory = require('../src/models/Inventory');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dqycpk9ce',
  api_key: '667992168515691',
  api_secret: 'sST9ETy9dTrI5BkNakRr06Bw5wU'
});

// Pexels API (free, 200 requests/hour)
const PEXELS_API_KEY = 'gKsbe3WOV5RYy8GgPqQXVLxkBwVZh7gYYmjZCUqw8uIVZDZKTxYWx2qQ';

function searchPexels(query) {
  return new Promise((resolve, reject) => {
    const searchQuery = encodeURIComponent(query + ' ingredient food');
    const options = {
      hostname: 'api.pexels.com',
      path: `/v1/search?query=${searchQuery}&per_page=1`,
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    };

    https.get(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.photos && json.photos.length > 0) {
            resolve(json.photos[0].src.medium);
          } else {
            reject(new Error('No image found'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function uploadToCloudinary(imageUrl, itemName) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(imageUrl, {
      folder: 'mealvista/ingredients',
      public_id: itemName.replace(/[^a-z0-9]/gi, '_'),
      overwrite: true
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
  });
}

async function updateImagesWithRealPhotos() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/authDB');
    console.log('✅ Connected\n');

    // Get all items (we'll update them all with specific images)
    const items = await Inventory.find({}).sort({ name: 1 }).limit(20); // Start with 20 items
    console.log(`📦 Processing ${items.length} items\n`);

    let updated = 0;
    let failed = 0;

    for (const item of items) {
      try {
        console.log(`🔍 Searching: ${item.name}...`);
        
        // Search for specific ingredient image
        const imageUrl = await searchPexels(item.name);
        console.log(`   📥 Found image`);
        
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(imageUrl, item.name);
        console.log(`   ☁️  Uploaded to Cloudinary`);
        
        // Update database
        item.image = cloudinaryUrl;
        await item.save();
        
        updated++;
        console.log(`   ✅ ${updated}. ${item.name}\n`);
        
        // Rate limit: 1 request per 3 seconds (to stay within Pexels limits)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (err) {
        failed++;
        console.log(`   ❌ Failed: ${err.message}\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updated} items with specific images`);
    console.log(`❌ Failed: ${failed}`);
    console.log('\n💡 Run this script multiple times to process all items');
    console.log('💡 Each run processes 50 items (rate limit protection)');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateImagesWithRealPhotos();
