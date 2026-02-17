const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('🔍 Checking .env file...\n');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📝 Creating .env file with default values...\n');
  
  const defaultEnv = `# MongoDB Connection String
# For local MongoDB:
MONGO_URI=mongodb://localhost:27017/mealvista

# For MongoDB Atlas (cloud):
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mealvista

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000
`;

  fs.writeFileSync(envPath, defaultEnv);
  console.log('✅ .env file created successfully!');
  console.log('⚠️  Please edit .env file and update MONGO_URI with your MongoDB connection string\n');
} else {
  console.log('✅ .env file exists');
  
  // Read and check contents
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  let hasMongoUri = false;
  let hasJwtSecret = false;
  
  lines.forEach(line => {
    if (line.trim().startsWith('MONGO_URI=') && !line.trim().startsWith('#')) {
      hasMongoUri = true;
      const uri = line.split('=')[1]?.trim();
      if (!uri || uri === '' || uri.includes('your-') || uri.includes('username')) {
        console.log('⚠️  MONGO_URI is set but may need to be updated');
      } else {
        console.log('✅ MONGO_URI is configured');
      }
    }
    if (line.trim().startsWith('JWT_SECRET=') && !line.trim().startsWith('#')) {
      hasJwtSecret = true;
      const secret = line.split('=')[1]?.trim();
      if (!secret || secret === '' || secret.includes('your-') || secret.includes('change-this')) {
        console.log('⚠️  JWT_SECRET is set but should be changed in production');
      } else {
        console.log('✅ JWT_SECRET is configured');
      }
    }
  });
  
  if (!hasMongoUri) {
    console.log('❌ MONGO_URI is missing in .env file');
    console.log('📝 Adding MONGO_URI to .env file...\n');
    
    const updatedContent = envContent + '\n# MongoDB Connection\nMONGO_URI=mongodb://localhost:27017/mealvista\n';
    fs.writeFileSync(envPath, updatedContent);
    console.log('✅ MONGO_URI added to .env file');
    console.log('⚠️  Please update MONGO_URI with your actual MongoDB connection string\n');
  }
  
  if (!hasJwtSecret) {
    console.log('⚠️  JWT_SECRET is missing, adding default...');
    const updatedContent = envContent + '\n# JWT Secret\nJWT_SECRET=your-super-secret-jwt-key-change-this-in-production\n';
    fs.writeFileSync(envPath, updatedContent);
  }
}

console.log('\n📋 Next steps:');
console.log('1. Edit .env file and set MONGO_URI to your MongoDB connection string');
console.log('2. For local MongoDB: MONGO_URI=mongodb://localhost:27017/mealvista');
console.log('3. For MongoDB Atlas: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/mealvista');
console.log('4. Make sure MongoDB is running (for local)');
console.log('5. Restart your server: npm start\n');


