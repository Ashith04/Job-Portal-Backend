require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'admin@jobportal.com' });
    if (existing) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@jobportal.com',
      password: 'Admin@123456',
      role: 'admin',
    });

    console.log('Admin created successfully:');
    console.log('  Email: admin@jobportal.com');
    console.log('  Password: Admin@123456');
    console.log('  ID:', admin._id);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
