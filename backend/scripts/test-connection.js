const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection...\n');
  console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Not set');
  
  if (process.env.MONGO_URI) {
    console.log('Connection string:', process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
  }
  
  console.log('\n🔄 Attempting to connect...\n');
  
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections:', collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None (database is empty)');
    
    await mongoose.disconnect();
    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection Failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Solution: MongoDB is not running!');
      console.error('   Start MongoDB:');
      console.error('   - Windows: net start MongoDB');
      console.error('   - Or start MongoDB Compass');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Solution: Check your MongoDB credentials');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Solution: MongoDB server is not reachable');
      console.error('   Check if MongoDB is running on localhost:27017');
    }
    
    process.exit(1);
  }
}

testConnection();


