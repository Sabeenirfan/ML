const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Inventory = require('../src/models/Inventory');

// Unsplash Access Key (free tier - 50 requests/hour)
// Using demo key - limited to 50 requests/hour
const UNSPLASH_ACCESS_KEY = 'tXJH8W3H8I_cN5qN4Y9W8MnJvY7KM1KeOh3YKH3Gxpg';

// Create images folder if not exists
const IMAGES_FOLDER = path.join(__dirname, '../images');
if (!fs.existsSync(IMAGES_FOLDER)) {
  fs.mkdirSync(IMAGES_FOLDER);
}

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Search and download from Unsplash
async function searchAndDownload(itemName) {
  return new Promise((resolve, reject) => {
    const searchQuery = encodeURIComponent(itemName + ' food ingredient');
    const url = `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`;
    
    https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', async () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            const imageUrl = json.results[0].urls.regular;
            const filepath = path.join(IMAGES_FOLDER, `${itemName}.jpg`);
            await downloadImage(imageUrl, filepath);
            resolve(filepath);
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

// Main function
async function autoDownloadImages() {
  if (UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
    console.log('\n❌ ERROR: Unsplash API key not configured!');
    console.log('\n📝 To use auto-download:');
    console.log('1. Go to: https://unsplash.com/developers');
    console.log('2. Create a free account');
    console.log('3. Create a new app');
    console.log('4. Copy your Access Key');
    console.log('5. Replace UNSPLASH_ACCESS_KEY in this file\n');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/authDB');
    console.log('✅ Connected\n');

    // Get items without images
    const items = await Inventory.find({ $or: [{ image: null }, { image: '' }] }).limit(50);
    
    console.log(`📦 Found ${items.length} items without images`);
    console.log('🚀 Starting download (max 50 items)...\n');

    let downloaded = 0;
    let failed = 0;

    for (const item of items) {
      try {
        console.log(`📥 Downloading: ${item.name}...`);
        await searchAndDownload(item.name);
        downloaded++;
        console.log(`   ✅ Downloaded\n`);
        
        // Rate limit: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (err) {
        failed++;
        console.log(`   ❌ Failed: ${err.message}\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 DOWNLOAD SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Downloaded: ${downloaded} images`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n📁 Images saved to: ${IMAGES_FOLDER}/`);
    console.log('\n💡 Next step: Run "node upload-images.js" to upload to Cloudinary');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

autoDownloadImages();
