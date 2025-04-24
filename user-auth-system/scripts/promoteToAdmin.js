const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Email of the user to promote
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Please provide an email address as an argument');
  console.log('Usage: node promoteToAdmin.js user@example.com');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for promoting user to admin...');
    
    try {
      // Find the user
      const user = await User.findOne({ email: userEmail });
      
      if (!user) {
        console.error(`User with email ${userEmail} not found`);
        await mongoose.disconnect();
        return;
      }
      
      console.log(`Found user: ${user.name} (${user.email})`);
      console.log(`Current role: ${user.role}`);
      
      // Update user role to admin
      user.role = 'admin';
      await user.save();
      
      console.log(`User ${user.name} (${user.email}) has been promoted to admin`);
      
    } catch (error) {
      console.error('Error promoting user:', error);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });