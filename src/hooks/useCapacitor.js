import { useEffect } from 'react';
import { initPushNotifications } from './capacitor/pushNotifications';
import { cacheLeads, cacheTeamMembers } from './capacitor/offlineStorage';

/**
 * Initialize Capacitor mobile features
 * This hook sets up push notifications and offline storage
 * Only runs on mobile devices, not on web
 */
export const useCapacitorInit = () => {
  useEffect(() => {
    const initCapacitor = async () => {
      // Only initialize if running on mobile (Capacitor environment)
      if (typeof process !== 'undefined' && process.env.CAPACITOR) {
        try {
          console.log('Initializing Capacitor mobile features...');
          
          // Initialize push notifications
          await initPushNotifications();
          
          console.log('Capacitor initialized successfully');
        } catch (error) {
          console.error('Failed to initialize Capacitor:', error);
        }
      }
    };

    initCapacitor();

    // Cleanup on unmount
    return () => {
      // Any cleanup needed
    };
  }, []);
};

/**
 * Cache data for offline access
 * Call this after fetching leads/team members
 */
export const useOfflineCache = (leads, teamMembers) => {
  useEffect(() => {
    const cacheData = async () => {
      if (leads && leads.length > 0) {
        await cacheLeads(leads);
      }
      if (teamMembers && teamMembers.length > 0) {
        await cacheTeamMembers(teamMembers);
      }
    };

    cacheData();
  }, [leads, teamMembers]);
};
