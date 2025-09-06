import React from 'react';
import { AlertTriangle, Settings } from 'lucide-react';

export default function DevAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Thakii Lecture2PDF
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Firebase Authentication Setup Required
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Firebase Configuration Needed
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              To use the authentication features, please configure Firebase.
            </p>
          </div>

          <div className="mt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="text-sm text-yellow-800">
                <h4 className="font-semibold mb-2">Setup Steps:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Create a Firebase project</li>
                  <li>Enable Authentication</li>
                  <li>Get your web app config</li>
                  <li>Update the .env file</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="w-4 h-4 mr-2" />
              Open Firebase Console
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              See <strong>AUTHENTICATION_SETUP.md</strong> for detailed instructions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}