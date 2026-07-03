import { Storage } from '@capacitor/storage';

/**
 * Offline data storage for Capacitor apps
 * Keeps data synced when offline, syncs when back online
 */

const STORAGE_PREFIX = 'yalabyte_crm_';

/**
 * Save data to device storage
 */
export const saveToDeviceStorage = async (key, data) => {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    await Storage.set({
      key: fullKey,
      value: JSON.stringify(data),
    });
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
  }
};

/**
 * Retrieve data from device storage
 */
export const getFromDeviceStorage = async (key) => {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    const { value } = await Storage.get({ key: fullKey });
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Failed to retrieve ${key} from storage:`, error);
    return null;
  }
};

/**
 * Remove data from device storage
 */
export const removeFromDeviceStorage = async (key) => {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    await Storage.remove({ key: fullKey });
  } catch (error) {
    console.error(`Failed to remove ${key} from storage:`, error);
  }
};

/**
 * Clear all YalaByte CRM data from storage
 */
export const clearAllDeviceStorage = async () => {
  try {
    const { keys } = await Storage.keys();
    const crmKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
    for (const key of crmKeys) {
      await Storage.remove({ key });
    }
  } catch (error) {
    console.error('Failed to clear device storage:', error);
  }
};

/**
 * Save leads for offline access
 */
export const cacheLeads = async (leads) => {
  await saveToDeviceStorage('leads', leads);
};

/**
 * Get cached leads
 */
export const getCachedLeads = async () => {
  return await getFromDeviceStorage('leads');
};

/**
 * Save team members for offline access
 */
export const cacheTeamMembers = async (members) => {
  await saveToDeviceStorage('team_members', members);
};

/**
 * Get cached team members
 */
export const getCachedTeamMembers = async () => {
  return await getFromDeviceStorage('team_members');
};

/**
 * Queue operations for offline sync
 * Use this to queue data changes that will sync when back online
 */
export const queueOfflineOperation = async (operationType, data) => {
  try {
    const queue = (await getFromDeviceStorage('offline_queue')) || [];
    queue.push({
      type: operationType,
      data,
      timestamp: Date.now(),
    });
    await saveToDeviceStorage('offline_queue', queue);
  } catch (error) {
    console.error('Failed to queue offline operation:', error);
  }
};

/**
 * Get all pending offline operations
 */
export const getPendingOfflineOperations = async () => {
  return (await getFromDeviceStorage('offline_queue')) || [];
};

/**
 * Clear offline operation queue after successful sync
 */
export const clearOfflineQueue = async () => {
  await removeFromDeviceStorage('offline_queue');
};
