const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const Inventory = require('../src/models/Inventory');

// ==========================================
// CONFIGURATION - ADD YOUR CLOUDINARY CREDENTIALS
// ==========================================
cloudinary.config({
  cloud_name: 'dqycpk9ce',
  api_key: '667992168515691',
  api_secret: 'sST9ETy9dTrI5BkNakRr06Bw5wU'
});

// Path to your images folder
const IMAGES_FOLDER = path.join(__dirname, '../images');

// ==========================================
// MAIN UPLOAD FUNCTION
// ==========================================
async function uploadImages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/authDB');
    console.log('✅ Connected to MongoDB\n');

    // Check if images folder exists
    if (!fs.existsSync(IMAGES_FOLDER)) {
      console.error(`❌ Images folder not found: ${IMAGES_FOLDER}`);
      console.log('\n📁 Please create a folder called "images" and add your ingredient images');
      console.log('   Example: images/Onion.jpg, images/Garlic.png, etc.');
      process.exit(1);
    }

    // Get all image files
    const imageFiles = fs.readdirSync(IMAGES_FOLDER)
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

    console.log(`📁 Found ${imageFiles.length} images in folder\n`);

    if (imageFiles.length === 0) {
      console.log('❌ No images found. Please add images to the images/ folder');
      process.exit(1);
    }

    // Get all inventory items
    const allItems = await Inventory.find({});
    console.log(`📦 Found ${allItems.length} items in database\n`);

    let uploaded = 0;
    let matched = 0;
    let notMatched = [];

    console.log('🚀 Starting upload...\n');

    for (const imageFile of imageFiles) {
      const imagePath = path.join(IMAGES_FOLDER, imageFile);
      const itemName = path.parse(imageFile).name; // Remove extension

      // Find matching item in database (case-insensitive)
      const item = allItems.find(i => 
        i.name.toLowerCase() === itemName.toLowerCase()
      );

      if (!item) {
        notMatched.push(itemName);
        console.log(`⚠️  No match found for: ${itemName}`);
        continue;
      }

      try {
        // Upload to Cloudinary
        console.log(`📤 Uploading: ${itemName}...`);
        const result = await cloudinary.uploader.upload(imagePath, {
          folder: 'mealvista/ingredients',
          public_id: itemName.replace(/\s+/g, '_'),
          overwrite: true
        });

        // Update database with image URL
        item.image = result.secure_url;
        await item.save();

        uploaded++;
        matched++;
        console.log(`   ✅ Uploaded and saved: ${itemName}`);
        console.log(`   🔗 URL: ${result.secure_url}\n`);

      } catch (err) {
        console.error(`   ❌ Failed to upload ${itemName}:`, err.message, '\n');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 UPLOAD SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully uploaded: ${uploaded} images`);
    console.log(`🔗 Database records updated: ${matched}`);
    console.log(`⚠️  Not matched: ${notMatched.length}`);
    
    if (notMatched.length > 0) {
      console.log('\n📝 Images without database match:');
      notMatched.forEach(name => console.log(`   - ${name}`));
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// ==========================================
// RUN
// ==========================================
uploadImages();
