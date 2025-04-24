const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for listing users...');
    
    try {
      // Find all users
      const users = await User.find().select('-password');
      
      console.log('\nUsers in the database:');
      console.log('=====================');
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('---------------------');
      });
      
      console.log(`\nTotal users: ${users.length}`);
      
      // Count by role
      const adminCount = users.filter(user => user.role === 'admin').length;
      const regularCount = users.filter(user => user.role === 'user').length;
      
      console.log(`Admin users: ${adminCount}`);
      console.log(`Regular users: ${regularCount}`);
      
    } catch (error) {
      console.error('Error listing users:', error);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nMongoDB disconnected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });