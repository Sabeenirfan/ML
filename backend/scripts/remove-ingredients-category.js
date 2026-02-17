const mongoose = require('mongoose');
const Inventory = require('../src/models/Inventory');

mongoose.connect('mongodb://localhost:27017/authDB')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find items with "Ingredients" category
    const ingredientsItems = await Inventory.find({ category: 'Ingredients' });
    console.log(`\nFound ${ingredientsItems.length} items in "Ingredients" category:`);
    ingredientsItems.forEach(item => {
      console.log(`  - ${item.name} (ID: ${item._id})`);
    });
    
    if (ingredientsItems.length > 0) {
      console.log('\nDeleting these items...');
      const result = await Inventory.deleteMany({ category: 'Ingredients' });
      console.log(`✅ Deleted ${result.deletedCount} items from "Ingredients" category`);
    } else {
      console.log('\n✅ No items found in "Ingredients" category');
    }
    
    // Show updated category list
    const categories = await Inventory.distinct('category');
    console.log('\n=== Updated Categories ===');
    categories.forEach(cat => console.log(`  - ${cat}`));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
