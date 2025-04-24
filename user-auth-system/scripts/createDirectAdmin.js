const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for creating admin...');
    
    try {
      // Use the imported User model
      
      // Admin user details
      const adminEmail = 'admin@test.com';
      const adminPassword = 'password123';
      
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (existingAdmin) {
        console.log(`Admin user with email ${adminEmail} already exists`);
        await mongoose.disconnect();
        return;
      }
      
      // Hash password manually
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Create admin user directly in the database
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log(`Admin user created with email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      
      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    } catch (error) {
      console.error('Error creating admin user:', error);
      await mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });