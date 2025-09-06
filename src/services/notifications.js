import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';

/**
 * Real-time Notification Service for push notifications
 */
export const notificationService = {
  /**
   * Set up a real-time listener for notifications
   * @param {Function} onNotification - Callback function that receives new notifications
   * @returns {Function} Unsubscribe function to stop listening
   */
  subscribeToNotifications(onNotification) {
    try {
      console.log('Setting up real-time notification listener...');
      
      // Create a query against the notifications collection
      const notificationsRef = collection(db, 'notifications');
      const notificationsQuery = query(
        notificationsRef, 
        orderBy('timestamp', 'desc'), 
        limit(10)
      );
      
      // Set up the listener
      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = {
              id: change.doc.id,
              ...change.doc.data()
            };
            
            console.log('Received new notification:', notification);
            
            // Show toast notification
            if (notification.title && notification.body) {
              toast.success(`${notification.title}: ${notification.body}`, {
                duration: 6000,
                icon: '🔔'
              });
            }
            
            // Call the callback with the notification
            onNotification(notification);
          }
        });
      }, (error) => {
        console.error('Error listening to notifications:', error);
        toast.error('Failed to get real-time notifications');
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      toast.error('Failed to set up real-time notifications');
      return () => {}; // Return empty function as fallback
    }
  },
  
  /**
   * Set up a listener for system notifications (broadcasts)
   * @param {Function} onSystemNotification - Callback function that receives system notifications
   * @returns {Function} Unsubscribe function to stop listening
   */
  subscribeToSystemNotifications(onSystemNotification) {
    try {
      console.log('Setting up system notification listener...');
      
      // Listen to the system notifications document
      const systemRef = collection(db, 'system');
      
      const unsubscribe = onSnapshot(systemRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified' && change.doc.id === 'notifications') {
            const systemData = change.doc.data();
            
            if (systemData.last_notification) {
              console.log('Received system notification:', systemData.last_notification);
              
              // Show toast for system notifications
              toast.success(
                `${systemData.last_notification.title}: ${systemData.last_notification.body}`, 
                {
                  duration: 6000,
                  icon: '📢'
                }
              );
              
              onSystemNotification(systemData);
            }
          }
        });
      }, (error) => {
        console.error('Error listening to system notifications:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to system notifications:', error);
      return () => {};
    }
  }
};

export default notificationService;