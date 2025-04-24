const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for checking users...');
    
    try {
      // Find all users
      const users = await User.find();
      
      console.log('Users in database:');
      users.forEach(user => {
        console.log(`- ID: ${user._id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Role: ${user.role}`);
        console.log('-------------------');
      });
      
      console.log(`Total users: ${users.length}`);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });