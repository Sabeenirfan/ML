#!/usr/bin/env node

const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const API_URL = `http://192.168.1.20:5000`;

console.log('🧪 Testing Google Authentication Endpoint\n');
console.log(`Backend URL: ${API_URL}`);
console.log(`Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Not set'}\n`);

// This is a test ID token - in real scenarios, this would come from Google
// For now, we'll just test if the endpoint responds
const testIdToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGdtYWlsLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhdWQiOiI3MzIxODYzMzk5NTEtaGI4c2RrcXd0NzBndnZiMnZiNzhkaG1rdmwyNXA3bzMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTYwMDAwMDAwMH0.test';

async function testGoogleAuth() {
  try {
    console.log('📤 Sending test request to /api/auth/google\n');
    
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/api/auth/google`, {
      idToken: testIdToken
    }, {
      timeout: 15000
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Response received in ${duration}ms`);
    console.log(`Status: ${response.status}\n`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ Request failed after ${duration}ms\n`);
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused - backend may not be running');
      console.error(`   Try: npm start (in the backend directory)`);
    } else if (error.code === 'ENOTFOUND') {
      console.error('❌ Host not found');
      console.error(`   Check if ${API_URL} is reachable`);
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Test simple endpoint first
async function testSimpleEndpoint() {
  try {
    console.log('🔍 Testing basic connectivity to /api/test\n');
    const response = await axios.get(`${API_URL}/api/test`, {
      timeout: 5000
    });
    console.log(`✅ Backend is reachable`);
    console.log(`Response: ${response.data.message}\n`);
    return true;
  } catch (error) {
    console.error(`❌ Cannot reach backend at ${API_URL}`);
    console.error(`Error: ${error.message}\n`);
    return false;
  }
}

(async () => {
  const isReachable = await testSimpleEndpoint();
  if (isReachable) {
    await testGoogleAuth();
  }
})();
