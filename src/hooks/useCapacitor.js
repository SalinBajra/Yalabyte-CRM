import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { cacheLeads, cacheTeamMembers } from '../capacitor/offlineStorage';
import { cleanupPushNotifications, initPushNotifications } from '../capacitor/pushNotifications';

export const isNativeMobile = () => Capacitor.isNativePlatform();

export const useCapacitorInit = (currentUser) => {
  useEffect(() => {
    if (!isNativeMobile() || !currentUser?.id) return undefined;

    let cancelled = false;
    const initCapacitor = async () => {
      try {
        await initPushNotifications(currentUser);
        if (!cancelled) console.log('Capacitor mobile features initialized.');
      } catch (error) {
        console.error('Failed to initialize Capacitor:', error);
      }
    };

    initCapacitor();
    return () => {
      cancelled = true;
      cleanupPushNotifications();
    };
  }, [currentUser?.id]);
};

export const useOfflineCache = (leads, teamMembers) => {
  useEffect(() => {
    if (!isNativeMobile()) return undefined;

    let cancelled = false;
    const cacheData = async () => {
      if (cancelled) return;
      if (leads && leads.length > 0) {
        await cacheLeads(leads);
      }
      if (teamMembers && teamMembers.length > 0) {
        await cacheTeamMembers(teamMembers);
      }
    };

    cacheData();
    return () => {
      cancelled = true;
    };
  }, [leads, teamMembers]);
};
