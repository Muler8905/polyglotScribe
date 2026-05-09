import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Profile from './src/models/Profile.js';
import UserToken from './src/models/UserToken.js';
import UserRole from './src/models/UserRole.js';

// Load environment variables
dotenv.config();

const deleteAllUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n⚠️  WARNING: This will delete ALL users and related data!');
    console.log('Press Ctrl+C to cancel...\n');

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Count before deletion
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users`);

    if (userCount === 0) {
      console.log('No users to delete.');
      process.exit(0);
    }

    // Delete all related data
    console.log('\nDeleting all data...');
    
    const profileResult = await Profile.deleteMany({});
    console.log('✅ Deleted profiles:', profileResult.deletedCount);
    
    const tokenResult = await UserToken.deleteMany({});
    console.log('✅ Deleted tokens:', tokenResult.deletedCount);
    
    const roleResult = await UserRole.deleteMany({});
    console.log('✅ Deleted roles:', roleResult.deletedCount);

    // Delete all users
    const userResult = await User.deleteMany({});
    console.log('✅ Deleted users:', userResult.deletedCount);

    console.log('\n🎉 All users and related data deleted successfully!');
    console.log('You can now create fresh accounts.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

deleteAllUsers();
