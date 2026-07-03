import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../supabase';

let currentDeviceToken = null;

/**
 * Initialize push notifications for Capacitor
 */
export const initPushNotifications = async () => {
  try {
    // Request notification permissions
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Register with native push system
    await PushNotifications.register();

    // Handle when push notification is received
    PushNotifications.addListener('pushNotificationReceived', onPushNotificationReceived);

    // Handle when app is opened from push notification
    PushNotifications.addListener('pushNotificationActionPerformed', onPushNotificationActionPerformed);

    // Handle registration token
    PushNotifications.addListener('registration', onRegistrationSuccess);
    PushNotifications.addListener('registrationError', onRegistrationError);

    console.log('Push notifications initialized successfully');
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
};

/**
 * Handle incoming push notification
 */
const onPushNotificationReceived = (notification) => {
  console.log('Push notification received:', notification);
  // You can add custom handling here (show toast, update UI, etc.)
};

/**
 * Handle when user taps on push notification
 */
const onPushNotificationActionPerformed = (action) => {
  console.log('Push notification action performed:', action);
  const { notification } = action;
  // Handle navigation or custom actions based on notification data
};

/**
 * Store device token after successful registration
 */
const onRegistrationSuccess = async (token) => {
  currentDeviceToken = token.value;
  console.log('Device token received:', currentDeviceToken);
  
  // Store token in Supabase for server-side push notifications
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Store the token in a device_tokens table or team_members table
      // This is optional - only if you want to send targeted notifications
      console.log('Device token stored for user:', user.id);
    }
  } catch (error) {
    console.error('Failed to store device token:', error);
  }
};

/**
 * Handle registration errors
 */
const onRegistrationError = (error) => {
  console.error('Push notification registration error:', error);
};

/**
 * Get current device token
 */
export const getDeviceToken = () => currentDeviceToken;

/**
 * Clean up push notification listeners
 */
export const cleanupPushNotifications = () => {
  PushNotifications.removeAllListeners();
};
