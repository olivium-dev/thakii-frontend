import React, { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { FiBell, FiLoader } from 'react-icons/fi';

function TestNotificationButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  const sendTestNotification = async (type = 'simple') => {
    setIsLoading(true);
    try {
      console.log(`Sending test notification of type: ${type}`);
      
      const response = await apiService.sendTestNotification(type);
      
      console.log('Test notification response:', response);
      
      toast.success('🔔 Test notification sent successfully!', {
        duration: 4000,
        icon: '✅'
      });
      
      // Show details of what was sent
      if (response.result) {
        setTimeout(() => {
          toast.success(`📧 ${response.result.title}`, {
            duration: 6000,
            icon: '📬'
          });
        }, 1000);
      }
      
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('❌ Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4">
        🔔 Push Notification Testing
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Test the real-time push notification system. These notifications will be sent to all users 
        and will appear in real-time via Firebase Firestore listeners.
      </p>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => sendTestNotification('simple')}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? (
            <FiLoader className="animate-spin mr-2" />
          ) : (
            <FiBell className="mr-2" />
          )}
          Send Simple Test
        </button>
        
        <button
          onClick={() => sendTestNotification('video_update')}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading ? (
            <FiLoader className="animate-spin mr-2" />
          ) : (
            <FiBell className="mr-2" />
          )}
          Send Video Update Test
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>How it works:</strong> This sends real push notifications through Firebase Firestore. 
              The notifications will appear as toast messages in real-time to all connected users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestNotificationButton;