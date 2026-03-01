require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = require('../models/User');
  const Complaint = require('../models/Complaint');
  const Notification = require('../models/Notification');

  await Promise.all([User.deleteMany({}), Complaint.deleteMany({}), Notification.deleteMany({})]);
  console.log('Cleared existing data');

  // Create admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@jantavoice.com',
    password: 'Admin@123',
    role: 'admin',
  });

  // Create test user
  const user1 = await User.create({
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    password: 'Test@123',
    role: 'user',
  });

  console.log('✅ Seed users created:');
  console.log('  Admin: admin@jantavoice.com / Admin@123');
  console.log('  User:  rahul@example.com / Test@123');
  console.log('\n🚀 Ready to use!');

  await mongoose.connection.close();
}

seed().catch(console.error);
