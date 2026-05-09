import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import UserRole from './src/models/UserRole.js';

// Load environment variables
dotenv.config();

const makeAdmin = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      console.log('\nAvailable users:');
      const allUsers = await User.find().select('email displayName');
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.displayName})`));
      process.exit(1);
    }

    console.log('Found user:', {
      id: user._id,
      email: user.email,
      displayName: user.displayName
    });

    // Check if role exists
    let role = await UserRole.findOne({ userId: user._id });
    
    if (!role) {
      // Create role if it doesn't exist
      role = await UserRole.create({
        userId: user._id,
        role: 'admin'
      });
      console.log('✅ Created admin role for user');
    } else if (role.role === 'admin') {
      console.log('ℹ️  User is already an admin');
    } else {
      // Update to admin
      role.role = 'admin';
      await role.save();
      console.log('✅ Updated user role to admin');
    }

    console.log('\n🎉 Success! User is now an admin.');
    console.log('\nYou can now:');
    console.log('1. Sign in to your account');
    console.log('2. Go to the dashboard');
    console.log('3. Click the "Admin Console" button');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node make-admin.js <email>');
  console.log('Example: node make-admin.js test@example.com');
  process.exit(1);
}

makeAdmin(email);
