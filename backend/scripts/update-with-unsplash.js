const mongoose = require('mongoose');
const https = require('https');
const Inventory = require('../src/models/Inventory');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dqycpk9ce',
  api_key: '667992168515691',
  api_secret: 'sST9ETy9dTrI5BkNakRr06Bw5wU'
});

// Unsplash API (Demo access: 50 requests/hour)
const UNSPLASH_ACCESS_KEY = 'RZEIOVfPhS7vMLkFdd2xfLNVvh7k_6SY0mN9_YxcVxA';

function searchUnsplash(query) {
  return new Promise((resolve, reject) => {
    const searchQuery = encodeURIComponent(query);
    const options = {
      hostname: 'api.unsplash.com',
      path: `/search/photos?query=${searchQuery}&per_page=1&orientation=landscape`,
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    };
    
    https.get(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            resolve(json.results[0].urls.regular);
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
      public_id: itemName.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
      overwrite: true
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
  });
}

async function updateWithUnsplash() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/authDB');
    console.log('✅ Connected\n');

    const items = await Inventory.find({}).sort({ name: 1 }).limit(40);
    console.log(`📦 Processing ${items.length} items (rate limit: 50/hour)\n`);

    let updated = 0;
    let failed = 0;
    let failedItems = [];

    for (const item of items) {
      try {
        console.log(`🔍 ${updated + failed + 1}/${items.length}: ${item.name}...`);
        
        const imageUrl = await searchUnsplash(item.name);
        const cloudinaryUrl = await uploadToCloudinary(imageUrl, item.name);
        
        item.image = cloudinaryUrl;
        await item.save();
        
        updated++;
        console.log(`   ✅ Uploaded to Cloudinary\n`);
        
        // Respect rate limit (50/hour = ~75 seconds between requests, use 2 seconds for now)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        failed++;
        failedItems.push(item.name);
        console.log(`   ⚠️  No specific image found\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Updated with specific images: ${updated}`);
    console.log(`⚠️  Could not find specific images: ${failed}`);
    
    if (failedItems.length > 0 && failedItems.length < 15) {
      console.log('\n📝 Items without specific match:');
      failedItems.forEach(name => console.log(`   - ${name}`));
    }
    
    console.log('\n💡 TIP: Run this script multiple times to process more items (50/hour limit)');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateWithUnsplash();
