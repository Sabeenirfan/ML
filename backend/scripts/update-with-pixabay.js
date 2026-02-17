const mongoose = require('mongoose');
const https = require('https');
const Inventory = require('../src/models/Inventory');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dqycpk9ce',
  api_key: '667992168515691',
  api_secret: 'sST9ETy9dTrI5BkNakRr06Bw5wU'
});

// Pixabay API (free, unlimited requests)
const PIXABAY_API_KEY = '48589568-54ae5ce5bbeb4e2bedb03aed8';

function searchPixabay(query) {
  return new Promise((resolve, reject) => {
    const searchQuery = encodeURIComponent(query);
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${searchQuery}&image_type=photo&category=food&per_page=3`;
    
    https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.hits && json.hits.length > 0) {
            resolve(json.hits[0].webformatURL);
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

async function updateWithPixabay() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/authDB');
    console.log('✅ Connected\n');

    const items = await Inventory.find({}).sort({ name: 1 }).limit(30);
    console.log(`📦 Processing ${items.length} items\n`);

    let updated = 0;
    let failed = 0;
    let failedItems = [];

    for (const item of items) {
      try {
        console.log(`🔍 ${updated + failed + 1}/${items.length}: ${item.name}...`);
        
        const imageUrl = await searchPixabay(item.name);
        const cloudinaryUrl = await uploadToCloudinary(imageUrl, item.name);
        
        item.image = cloudinaryUrl;
        await item.save();
        
        updated++;
        console.log(`   ✅ Updated with specific image\n`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (err) {
        failed++;
        failedItems.push(item.name);
        console.log(`   ⚠️  Using category default\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Updated with specific images: ${updated}`);
    console.log(`⚠️  Used defaults: ${failed}`);
    
    if (failedItems.length > 0 && failedItems.length < 10) {
      console.log('\n📝 Items without specific match:');
      failedItems.forEach(name => console.log(`   - ${name}`));
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateWithPixabay();
