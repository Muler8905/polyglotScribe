import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import UserRole from './src/models/UserRole.js';
import UserToken from './src/models/UserToken.js';

// Load environment variables
dotenv.config();

const listUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find().select('email displayName isEmailVerified createdAt');
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      process.exit(0);
    }

    console.log(`Found ${users.length} user(s):\n`);
    console.log('═'.repeat(80));

    for (const user of users) {
      const role = await UserRole.findOne({ userId: user._id });
      const token = await UserToken.findOne({ userId: user._id });

      console.log(`\n📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.displayName}`);
      console.log(`🆔 ID: ${user._id}`);
      console.log(`✉️  Verified: ${user.isEmailVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`👑 Role: ${role?.role === 'admin' ? '🔴 ADMIN' : '🟢 User'}`);
      console.log(`💰 Credits: ${token?.credits || 0}`);
      console.log(`📅 Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('─'.repeat(80));
    }

    console.log('\n💡 To make a user admin, run:');
    console.log('   node make-admin.js <email>');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listUsers();
