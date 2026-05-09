import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function testAdminEndpoints() {
  console.log('🧪 Testing Admin Endpoints\n');
  
  // You need to get a token first by signing in
  console.log('Step 1: Sign in to get a token');
  console.log('Please sign in through the UI first, then check localStorage for "accessToken"\n');
  
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ No token provided');
    console.log('\nUsage:');
    console.log('1. Sign in to http://localhost:8080/auth');
    console.log('2. Open browser console (F12)');
    console.log('3. Run: localStorage.getItem("accessToken")');
    console.log('4. Copy the token');
    console.log('5. Run: node test-admin-endpoints.js <your-token>\n');
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    // Test 1: Get profile (should include roles)
    console.log('Test 1: GET /api/app/profile');
    const profileRes = await fetch(`${API_URL}/app/profile`, { headers });
    const profileData = await profileRes.json();
    console.log('Status:', profileRes.status);
    console.log('Response:', JSON.stringify(profileData, null, 2));
    console.log('Is Admin?', profileData.data?.roles?.includes('admin') ? '✅ YES' : '❌ NO');
    console.log('');

    // Test 2: Get all users (admin only)
    console.log('Test 2: GET /api/app/admin/users');
    const usersRes = await fetch(`${API_URL}/app/admin/users`, { headers });
    const usersData = await usersRes.json();
    console.log('Status:', usersRes.status);
    if (usersRes.status === 200) {
      console.log('✅ Success! Found', usersData.data?.users?.length || 0, 'users');
      console.log('Users:', usersData.data?.users?.map(u => ({
        email: u.email,
        isAdmin: u.isAdmin,
        credits: u.credits
      })));
    } else {
      console.log('❌ Failed:', usersData.message);
    }
    console.log('');

    // Test 3: Get hero images
    console.log('Test 3: GET /api/app/hero-images');
    const heroRes = await fetch(`${API_URL}/app/hero-images`, { headers });
    const heroData = await heroRes.json();
    console.log('Status:', heroRes.status);
    console.log('Hero Images:', heroData.data?.items?.length || 0);
    console.log('');

    console.log('🎉 Tests complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminEndpoints();
