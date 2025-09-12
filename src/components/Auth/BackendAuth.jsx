import React, { useState } from 'react';
import { apiService } from '../../services/api';

function BackendAuth({ onAuthSuccess }) {
  const [email, setEmail] = useState('ouday.khaled@gmail.com');
  const [uid, setUid] = useState('WW0MMwGgqbZsauyt0nFzZB1Rkbd2');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (isAdmin = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔑 Logging in as ${isAdmin ? 'admin' : 'user'}: ${email}`);
      
      const response = isAdmin 
        ? await apiService.loginAsAdmin(email, uid)
        : await apiService.loginWithEmail(email, uid);
      
      if (response.custom_token) {
        console.log('✅ Authentication successful');
        
        // Get user info to confirm
        const userInfo = await apiService.getCurrentUser();
        console.log('✅ User info:', userInfo);
        
        onAuthSuccess({
          email: userInfo.user.email,
          uid: userInfo.user.uid,
          isAdmin: userInfo.user.is_admin,
          token: response.custom_token
        });
      } else {
        throw new Error('No token received from backend');
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Thakii Backend Authentication
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Login using backend authentication (no Firebase required)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="uid" className="block text-sm font-medium text-gray-700">
                User ID
              </label>
              <div className="mt-1">
                <input
                  id="uid"
                  name="uid"
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleLogin(false)}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login as User'}
              </button>
              
              <button
                onClick={() => handleLogin(true)}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login as Admin'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BackendAuth;
