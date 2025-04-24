const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for creating raw admin...');
    
    try {
      // Admin user details
      const adminEmail = 'superadmin@example.com';
      const adminPassword = 'admin123';
      
      // Hash password manually
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Create admin user directly in the database using the raw MongoDB driver
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      
      // Check if admin already exists
      const existingAdmin = await usersCollection.findOne({ email: adminEmail });
      if (existingAdmin) {
        console.log(`Admin user with email ${adminEmail} already exists`);
        await mongoose.disconnect();
        return;
      }
      
      // Insert the admin user directly
      await usersCollection.insertOne({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
      });
      
      console.log(`Admin user created with email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      
      // Verify the password works
      const savedAdmin = await usersCollection.findOne({ email: adminEmail });
      const passwordMatch = await bcrypt.compare(adminPassword, savedAdmin.password);
      
      console.log(`Password verification: ${passwordMatch ? 'SUCCESS' : 'FAILED'}`);
      
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