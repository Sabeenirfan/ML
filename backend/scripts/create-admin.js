const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/authDB';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected to:', mongoURI);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. MongoDB is running');
    console.log('   2. MONGO_URI in .env is correct');
    console.log('   3. Database name matches your setup');
    process.exit(1);
  }
};

async function createAdmin() {
  try {
    await connectDB();

    // Admin details - CHANGE THESE if needed!
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin8990'; // Change this password!
    const adminName = 'Admin User';

    console.log('\n🔍 Checking for existing admin...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists with email:', adminEmail);
      console.log('Updating existing user to admin...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Update to admin
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      
      console.log('\n✅ Admin updated successfully!');
      console.log('\n📋 Login Credentials:');
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
      console.log('\n🔐 Now you can login with these credentials!');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Create admin user
      const admin = new User({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isAdmin: true
      });
      
      await admin.save();
      
      console.log('\n✅ Admin created successfully!');
      console.log('\n📋 Login Credentials:');
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
      console.log('\n🔐 Now you can login with these credentials!');
      console.log('\n📍 Admin is stored in MongoDB:');
      console.log('   Database: authDB (or your MONGO_URI database)');
      console.log('   Collection: users');
      console.log('   Email:', adminEmail);
    }

    // Show the admin in database
    const adminUser = await User.findOne({ email: adminEmail });
    console.log('\n📊 Admin Details in MongoDB:');
    console.log('   _id:', adminUser._id);
    console.log('   name:', adminUser.name);
    console.log('   email:', adminUser.email);
    console.log('   role:', adminUser.role);
    console.log('   isAdmin:', adminUser.isAdmin);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

// Run the script
createAdmin();

