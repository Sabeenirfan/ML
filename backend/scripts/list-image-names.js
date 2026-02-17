const mongoose = require('mongoose');
const fs = require('fs');
const Inventory = require('../src/models/Inventory');

mongoose.connect('mongodb://localhost:27017/authDB')
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    const items = await Inventory.find({}).sort({ category: 1, name: 1 });
    
    console.log('='.repeat(70));
    console.log('📋 IMAGE NAMES NEEDED (Total: ' + items.length + ' items)');
    console.log('='.repeat(70));
    console.log('\nCreate images with these EXACT names:\n');
    
    let currentCategory = '';
    items.forEach((item, index) => {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        console.log('\n' + '─'.repeat(70));
        console.log(`📁 ${currentCategory}`);
        console.log('─'.repeat(70));
      }
      
      // Show if item already has image
      const hasImage = item.image ? '✅' : '❌';
      console.log(`${hasImage} ${item.name}.jpg`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('💡 TIP: You can use .jpg, .png, .jpeg, .gif, or .webp');
    console.log('💡 Example: "Onion.jpg" or "Basmati Rice.png"');
    console.log('='.repeat(70));
    
    // Count items with/without images
    const withImages = items.filter(i => i.image).length;
    const withoutImages = items.length - withImages;
    
    console.log(`\n📊 Current Status:`);
    console.log(`   ✅ With images: ${withImages}`);
    console.log(`   ❌ Without images: ${withoutImages}`);
    
    // Export list to text file
    const textList = items.map(i => `${i.name}.jpg`).join('\n');
    fs.writeFileSync('image-names-needed.txt', textList);
    console.log(`\n📄 Full list saved to: image-names-needed.txt`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
