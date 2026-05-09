import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Profile from './src/models/Profile.js';
import UserToken from './src/models/UserToken.js';
import UserRole from './src/models/UserRole.js';

// Load environment variables
dotenv.config();

const deleteUser = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    console.log('Found user:', {
      id: user._id,
      email: user.email,
      displayName: user.displayName
    });

    // Delete related data
    console.log('\nDeleting related data...');
    
    const profileResult = await Profile.deleteMany({ userId: user._id });
    console.log('✅ Deleted profiles:', profileResult.deletedCount);
    
    const tokenResult = await UserToken.deleteMany({ userId: user._id });
    console.log('✅ Deleted tokens:', tokenResult.deletedCount);
    
    const roleResult = await UserRole.deleteMany({ userId: user._id });
    console.log('✅ Deleted roles:', roleResult.deletedCount);

    // Delete user
    await User.deleteOne({ _id: user._id });
    console.log('✅ Deleted user:', email);

    console.log('\n🎉 User and all related data deleted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node delete-user.js <email>');
  console.log('Example: node delete-user.js test@example.com');
  process.exit(1);
}

deleteUser(email);
