const mongoose = require('mongoose');
const Inventory = require('../src/models/Inventory');

mongoose.connect('mongodb://localhost:27017/authDB')
  .then(async () => {
    const total = await Inventory.countDocuments();
    const withImages = await Inventory.countDocuments({ 
      image: { $ne: null, $ne: '' } 
    });
    
    console.log('\n📊 IMAGE STATUS');
    console.log('='.repeat(40));
    console.log(`Total items: ${total}`);
    console.log(`✅ With images: ${withImages}`);
    console.log(`❌ Without images: ${total - withImages}`);
    console.log(`📈 Coverage: ${((withImages / total) * 100).toFixed(1)}%`);
    console.log('='.repeat(40));
    
    process.exit(0);
  });
