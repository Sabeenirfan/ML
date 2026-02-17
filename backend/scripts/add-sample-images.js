const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Inventory = require('../src/models/Inventory');

cloudinary.config({
  cloud_name: 'dqycpk9ce',
  api_key: '667992168515691',
  api_secret: 'sST9ETy9dTrI5BkNakRr06Bw5wU'
});

// Sample URLs from Cloudinary/Unsplash for common ingredients
const ingredientImages = {
  // Vegetables
  'Onion': 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample_onion.jpg',
  'Garlic': 'https://images.unsplash.com/photo-1540700419-c2e531158c43?w=400',
  'Tomato': 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400',
  'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
  'Ginger': 'https://images.unsplash.com/photo-1605001011156-cbf0b0f70728?w=400',
  
  // Fruits
  'Apple': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400',
  'Banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
  'Orange': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400',
  
  // Grains
  'Basmati Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
  'Brown Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
  
  // Dairy
  'Milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
  'Yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
  
  // Meat
  'Chicken Breast': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400',
  
  // Default by category
  'default_vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
  'default_fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400',
  'default_meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400',
  'default_dairy': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
  'default_grains': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
  'default_spices': 'https://images.unsplash.com/photo-1596040033229-a0b928e46fb6?w=400',
  'default_beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
  'default_bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
  'default_snacks': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400',
  'default_nuts': 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=400',
  'default_oils': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
  'default_herbs': 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400',
  'default_condiments': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400'
};

const categoryDefaults = {
  'Vegetables': 'default_vegetables',
  'Fruits': 'default_fruits',
  'Meat & Protein': 'default_meat',
  'Dairy Products': 'default_dairy',
  'Grains & Pulses': 'default_grains',
  'Indian Spices': 'default_spices',
  'Pakistani Masalas': 'default_spices',
  'International Spices': 'default_spices',
  'Beverages': 'default_beverages',
  'Bakery Items': 'default_bakery',
  'Snacks': 'default_snacks',
  'Nuts & Seeds': 'default_nuts',
  'Oils & Fats': 'default_oils',
  'Herbs & Seasonings': 'default_herbs',
  'Condiments & Sauces': 'default_condiments'
};

async function addSampleImages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/authDB');
    console.log('✅ Connected\n');

    const items = await Inventory.find({ $or: [{ image: null }, { image: '' }] });
    console.log(`📦 Found ${items.length} items without images\n`);

    let updated = 0;
    let limit = 99999; // Update ALL items

    console.log('🚀 Adding images...\n');

    for (const item of items.slice(0, limit)) {
      try {
        let imageUrl = null;

        // Check if specific image exists
        if (ingredientImages[item.name]) {
          imageUrl = ingredientImages[item.name];
        } else {
          // Use category default
          const defaultKey = categoryDefaults[item.category];
          if (defaultKey) {
            imageUrl = ingredientImages[defaultKey];
          }
        }

        if (imageUrl) {
          item.image = imageUrl;
          await item.save();
          updated++;
          console.log(`✅ ${updated}. ${item.name} (${item.category})`);
        }

      } catch (err) {
        console.log(`❌ Failed: ${item.name} - ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updated} items with images`);
    console.log(`📋 Remaining: ${items.length - updated} items`);
    console.log('\n💡 Images are now visible in your admin panel!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSampleImages();
