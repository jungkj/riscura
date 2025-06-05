#!/usr/bin/env node

/**
 * Login Debug Script for Riscura Platform
 * This script helps debug login API issues
 */

async function testLoginAPI() {
  console.log('🔍 Testing Riscura Login API...\n');

  try {
    // Test GET endpoint first
    console.log('1. Testing GET /api/auth/login...');
    const getResponse = await fetch('http://localhost:3000/api/auth/login');
    const getContentType = getResponse.headers.get('content-type');
    
    console.log('   Status:', getResponse.status);
    console.log('   Content-Type:', getContentType);
    
    if (getContentType?.includes('application/json')) {
      const getData = await getResponse.json();
      console.log('   Response:', JSON.stringify(getData, null, 2));
      console.log('   ✅ GET endpoint is working\n');
    } else {
      const getText = await getResponse.text();
      console.log('   Response (text):', getText.substring(0, 200));
      console.log('   ❌ GET endpoint returning HTML instead of JSON\n');
      return;
    }

    // Test POST endpoint with demo credentials
    console.log('2. Testing POST /api/auth/login with demo credentials...');
    const postResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@riscura.com',
        password: 'admin123'
      }),
    });

    const postContentType = postResponse.headers.get('content-type');
    console.log('   Status:', postResponse.status);
    console.log('   Content-Type:', postContentType);

    if (postContentType?.includes('application/json')) {
      const postData = await postResponse.json();
      console.log('   Response:', JSON.stringify(postData, null, 2));
      
      if (postResponse.ok && postData.user) {
        console.log('   ✅ POST endpoint is working - login successful\n');
        
        // Test with invalid credentials
        console.log('3. Testing POST /api/auth/login with invalid credentials...');
        const invalidResponse = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'invalid@test.com',
            password: 'wrongpassword'
          }),
        });

        const invalidData = await invalidResponse.json();
        console.log('   Status:', invalidResponse.status);
        console.log('   Response:', JSON.stringify(invalidData, null, 2));
        
        if (invalidResponse.status === 401) {
          console.log('   ✅ Invalid credentials properly rejected\n');
        }
        
        console.log('🎉 All tests passed! The login API is working correctly.');
        console.log('   You can now use: admin@riscura.com / admin123');
        
      } else {
        console.log('   ❌ Login failed:', postData.error || 'Unknown error');
      }
    } else {
      const postText = await postResponse.text();
      console.log('   Response (text):', postText.substring(0, 200));
      console.log('   ❌ POST endpoint returning HTML instead of JSON');
    }

  } catch (error) {
    console.error('❌ Error testing login API:', error.message);
    console.log('\n💡 Make sure your development server is running:');
    console.log('   npm run dev');
  }
}

// Run the test
testLoginAPI(); 