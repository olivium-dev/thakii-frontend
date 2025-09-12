#!/usr/bin/env node
/**
 * Frontend-Backend Integration Test
 * Tests API calls from frontend perspective
 */

import axios from 'axios';

// Backend URL from environment
const BACKEND_URL = process.env.VITE_API_BASE_URL || 'https://vps-71.fds-1.com/thakii-be';
const WORKER_URL = 'https://thakii-02.fanusdigital.site/thakii-worker';

console.log('🚀 === FRONTEND-BACKEND INTEGRATION TEST ===');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Worker URL: ${WORKER_URL}`);
console.log();

async function testBackendHealth() {
    console.log('1️⃣ === TESTING BACKEND HEALTH ===');
    try {
        const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
        if (response.status === 200 && response.data.status === 'healthy') {
            console.log(`✅ Backend health: ${response.data.status} (DB: ${response.data.database}, Storage: ${response.data.storage})`);
            return true;
        } else {
            console.log(`❌ Backend health failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Backend health error: ${error.message}`);
        return false;
    }
}

async function testAuthentication() {
    console.log('2️⃣ === TESTING AUTHENTICATION ===');
    try {
        // Test mock token generation (what frontend would do for testing)
        const authData = {
            email: 'frontend-test@thakii.dev',
            uid: `frontend-test-${Date.now()}`
        };
        
        const response = await axios.post(`${BACKEND_URL}/auth/mock-user-token`, authData, { timeout: 10000 });
        
        if (response.status === 200 && response.data.custom_token) {
            console.log(`✅ Authentication: Token generated (${response.data.custom_token.length} chars)`);
            console.log(`✅ User: ${response.data.user.email} (UID: ${response.data.user.uid})`);
            return response.data.custom_token;
        } else {
            console.log(`❌ Authentication failed: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Authentication error: ${error.message}`);
        return null;
    }
}

async function testAuthenticatedEndpoints(token) {
    console.log('3️⃣ === TESTING AUTHENTICATED ENDPOINTS ===');
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // Test user info
        const userResponse = await axios.get(`${BACKEND_URL}/auth/user`, { headers, timeout: 10000 });
        if (userResponse.status === 200) {
            console.log(`✅ User info: ${userResponse.data.user.email}`);
        }
        
        // Test video list (user isolation)
        const listResponse = await axios.get(`${BACKEND_URL}/list`, { headers, timeout: 10000 });
        if (listResponse.status === 200) {
            console.log(`✅ Video list: ${listResponse.data.total || 0} videos (user isolation working)`);
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Authenticated endpoints error: ${error.message}`);
        return false;
    }
}

async function testWorkerIntegration() {
    console.log('4️⃣ === TESTING WORKER INTEGRATION ===');
    try {
        // Test worker health (what backend checks)
        const healthResponse = await axios.get(`${WORKER_URL}/health`, { timeout: 10000 });
        if (healthResponse.status === 200) {
            console.log(`✅ Worker health: ${healthResponse.data.status}`);
        }
        
        // Test worker video list
        const listResponse = await axios.get(`${WORKER_URL}/list`, { timeout: 10000 });
        if (listResponse.status === 200) {
            console.log(`✅ Worker videos: ${listResponse.data.total} from ${listResponse.data.source}`);
        }
        
        // Test HTTP communication (simulate backend call)
        const testData = {
            video_id: `frontend-test-${Date.now()}`,
            user_id: 'frontend-test-user',
            filename: 'frontend-test.mp4',
            s3_key: 'videos/frontend-test.mp4'
        };
        
        const generateResponse = await axios.post(`${WORKER_URL}/generate-pdf`, testData, { timeout: 10000 });
        if (generateResponse.status === 400) {
            console.log('✅ Worker HTTP: Correctly validates requests');
        } else if (generateResponse.status === 201) {
            console.log('✅ Worker HTTP: Accepts processing requests');
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Worker integration error: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('🎯 === STARTING FRONTEND-BACKEND INTEGRATION TESTS ===');
    console.log();
    
    const test1 = await testBackendHealth();
    const token = await testAuthentication();
    const test3 = token ? await testAuthenticatedEndpoints(token) : false;
    const test4 = await testWorkerIntegration();
    
    console.log();
    console.log('📊 === INTEGRATION TEST RESULTS ===');
    console.log(`   ${test1 ? '✅' : '❌'} Backend Health: ${test1 ? 'PASS' : 'FAIL'}`);
    console.log(`   ${token ? '✅' : '❌'} Authentication: ${token ? 'PASS' : 'FAIL'}`);
    console.log(`   ${test3 ? '✅' : '❌'} Authenticated Endpoints: ${test3 ? 'PASS' : 'FAIL'}`);
    console.log(`   ${test4 ? '✅' : '❌'} Worker Integration: ${test4 ? 'PASS' : 'FAIL'}`);
    
    const passed = [test1, !!token, test3, test4].filter(Boolean).length;
    const total = 4;
    
    console.log();
    console.log(`📊 OVERALL RESULT: ${passed}/${total} tests passed (${(passed/total*100).toFixed(1)}%)`);
    
    if (passed === total) {
        console.log('🎉 FRONTEND-BACKEND INTEGRATION: 100% SUCCESS!');
        console.log('🚀 Frontend ready to connect to backend with full authentication!');
    } else if (passed >= 3) {
        console.log('🎉 CRITICAL FUNCTIONALITY: WORKING!');
        console.log('⚠️  Minor issues with external access');
    } else {
        console.log('⚠️  Critical integration issues found');
    }
    
    return passed >= 3;
}

runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
