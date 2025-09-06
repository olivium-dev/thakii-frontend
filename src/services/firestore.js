import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

/**
 * Real-time Firestore service for push notifications and live updates
 */
export const firestoreService = {
  /**
   * Set up a real-time listener for a user's video tasks
   * @param {string} userId - The user ID to listen for
   * @param {Function} onUpdate - Callback function that receives the updated video list
   * @returns {Function} Unsubscribe function to stop listening
   */
  subscribeToUserVideos(userId, onUpdate) {
    try {
      console.log(`Setting up real-time listener for user: ${userId}`);
      
      // Create a query against the collection
      const videosRef = collection(db, 'video_tasks');
      const userVideosQuery = query(videosRef, where('user_id', '==', userId));
      
      // Set up the listener
      const unsubscribe = onSnapshot(userVideosQuery, (snapshot) => {
        const videos = [];
        snapshot.forEach((doc) => {
          videos.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`Received ${videos.length} videos update from Firestore`);
        onUpdate(videos);
      }, (error) => {
        console.error('Error listening to videos:', error);
        toast.error('Failed to get real-time updates');
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to videos:', error);
      toast.error('Failed to set up real-time updates');
      return () => {}; // Return empty function as fallback
    }
  },
  
  /**
   * Set up a real-time listener for all video tasks (admin only)
   * @param {Function} onUpdate - Callback function that receives the updated video list
   * @returns {Function} Unsubscribe function to stop listening
   */
  subscribeToAllVideos(onUpdate) {
    try {
      console.log('Setting up real-time listener for all videos (admin)');
      
      // Create a reference to the collection
      const videosRef = collection(db, 'video_tasks');
      
      // Set up the listener
      const unsubscribe = onSnapshot(videosRef, (snapshot) => {
        const videos = [];
        snapshot.forEach((doc) => {
          videos.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`Received ${videos.length} videos update from Firestore (admin)`);
        onUpdate(videos);
      }, (error) => {
        console.error('Error listening to all videos:', error);
        toast.error('Failed to get real-time admin updates');
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to all videos:', error);
      toast.error('Failed to set up real-time admin updates');
      return () => {}; // Return empty function as fallback
    }
  },
  
  /**
   * Set up a real-time listener for system health status
   * @param {Function} onUpdate - Callback function that receives the updated health status
   * @returns {Function} Unsubscribe function to stop listening
   */
  subscribeToHealthStatus(onUpdate) {
    try {
      console.log('Setting up real-time listener for system health');
      
      // Reference to the health status document
      const healthRef = doc(db, 'system', 'health');
      
      // Set up the listener
      const unsubscribe = onSnapshot(healthRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const healthData = docSnapshot.data();
          console.log('Received health update from Firestore:', healthData);
          onUpdate(healthData);
        } else {
          console.log('No health document exists');
          onUpdate({ status: 'unknown' });
        }
      }, (error) => {
        console.error('Error listening to health status:', error);
        onUpdate({ status: 'error' });
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to health status:', error);
      return () => {}; // Return empty function as fallback
    }
  },
  
  /**
   * Get admin statistics (one-time fetch)
   * @returns {Promise<Object>} Admin statistics
   */
  async getAdminStats() {
    try {
      const statsRef = doc(db, 'system', 'stats');
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        return statsDoc.data();
      } else {
        console.log('No stats document found');
        return {
          total_users: 0,
          total_videos: 0,
          total_pdfs: 0,
          active_processing: 0
        };
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }
};

export default firestoreService;