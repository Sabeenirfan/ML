const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Inventory = require('../src/models/Inventory');

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
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        reject(new Error(`Failed: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Generic placeholder images by category
const categoryImages = {
  'Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
  'Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400',
  'Meat & Protein': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400',
  'Dairy Products': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
  'Grains & Pulses': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
  'Beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
  'Indian Spices': 'https://images.unsplash.com/photo-1596040033229-a0b928e46fb6?w=400',
  'Pakistani Masalas': 'https://images.unsplash.com/photo-1596040033229-a0b928e46fb6?w=400',
  'International Spices': 'https://images.unsplash.com/photo-1596040033229-a0b928e46fb6?w=400',
  'Herbs & Seasonings': 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400',
  'Oils & Fats': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
  'Condiments & Sauces': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400',
  'Bakery Items': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
  'Snacks': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400',
  'Canned Foods': 'https://images.unsplash.com/photo-1631788589818-39296bed5641?w=400',
  'Frozen Foods': 'https://images.unsplash.com/photo-1631788589818-39296bed5641?w=400',
  'Nuts & Seeds': 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=400'
};

// Main function
async function downloadPlaceholders() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/authDB');
    console.log('✅ Connected\n');

    console.log('📥 Downloading category placeholder images...\n');

    let downloaded = 0;
    for (const [category, url] of Object.entries(categoryImages)) {
      try {
        const filename = `${category.replace(/[^a-z0-9]/gi, '_')}_placeholder.jpg`;
        const filepath = path.join(IMAGES_FOLDER, filename);
        
        if (fs.existsSync(filepath)) {
          console.log(`✅ Already exists: ${category}`);
          continue;
        }

        console.log(`📥 Downloading: ${category}...`);
        await downloadImage(url, filepath);
        downloaded++;
        console.log(`   ✅ Downloaded\n`);
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        console.log(`   ❌ Failed: ${err.message}\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Downloaded ${downloaded} placeholder images`);
    console.log('='.repeat(60));
    
    console.log('\n📝 These are category-level placeholder images.');
    console.log('💡 To get item-specific images, you need a Cloudinary account.');
    console.log('\n📋 Next Steps:');
    console.log('1. Sign up at: https://cloudinary.com/users/register_free');
    console.log('2. Get your credentials (Cloud Name, API Key, API Secret)');
    console.log('3. Update upload-images.js with your credentials');
    console.log('4. Run: node upload-images.js');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

downloadPlaceholders();
