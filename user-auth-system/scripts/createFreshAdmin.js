const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for creating fresh admin...');
    
    try {
      // Admin user details with very simple credentials
      const adminUser = {
        name: 'Admin',
        email: 'admin@admin.com',
        password: 'password',
        role: 'admin'
      };
      
      // Check if this admin already exists and delete it if it does
      const existingAdmin = await User.findOne({ email: adminUser.email });
      if (existingAdmin) {
        console.log(`Removing existing admin user with email ${adminUser.email}`);
        await User.deleteOne({ email: adminUser.email });
      }
      
      // Create the admin user directly with mongoose
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      
      const newAdmin = new User({
        name: adminUser.name,
        email: adminUser.email,
        password: hashedPassword,
        role: adminUser.role
      });
      
      await newAdmin.save();
      
      console.log('Admin user created successfully!');
      console.log(`Email: ${adminUser.email}`);
      console.log(`Password: ${adminUser.password}`);
      
      // Verify the password works
      const savedAdmin = await User.findOne({ email: adminUser.email }).select('+password');
      const passwordMatch = await bcrypt.compare(adminUser.password, savedAdmin.password);
      
      console.log(`Password verification: ${passwordMatch ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });