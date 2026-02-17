const mongoose = require('mongoose');
const Inventory = require('../src/models/Inventory');

mongoose.connect('mongodb://localhost:27017/authDB')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const categories = await Inventory.distinct('category');
    console.log('\n=== Categories in Database ===');
    console.log(JSON.stringify(categories, null, 2));
    
    const count = await Inventory.countDocuments();
    console.log('\nTotal items:', count);
    
    // Show sample items from each category
    for (const cat of categories) {
      const items = await Inventory.find({ category: cat }).limit(3);
      console.log(`\n${cat} (${items.length} samples):`);
      items.forEach(item => console.log(`  - ${item.name}`));
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
