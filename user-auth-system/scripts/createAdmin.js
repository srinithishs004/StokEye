const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for creating admin...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Admin user details
const adminUser = {
  name: 'Admin User',
  email: 'admin@stockeye.com',
  password: 'admin123',
  role: 'admin'
};

// Function to create admin user
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);
    
    // Create admin user
    const admin = await User.create({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      role: adminUser.role
    });
    
    console.log(`Admin user created with email: ${admin.email}`);
    console.log('Password: admin123');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the function
createAdmin();