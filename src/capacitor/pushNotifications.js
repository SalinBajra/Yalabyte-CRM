import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../supabase';

let currentDeviceToken = null;
let currentUser = null;
let listenersRegistered = false;

export const initPushNotifications = async (user) => {
  if (!Capacitor.isNativePlatform()) return;
  currentUser = user;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    if (!listenersRegistered) {
      await PushNotifications.addListener('pushNotificationReceived', onPushNotificationReceived);
      await PushNotifications.addListener('pushNotificationActionPerformed', onPushNotificationActionPerformed);
      await PushNotifications.addListener('registration', onRegistrationSuccess);
      await PushNotifications.addListener('registrationError', onRegistrationError);
      listenersRegistered = true;
    }

    await PushNotifications.register();

    console.log('Push notifications initialized successfully');
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
};

const onPushNotificationReceived = (notification) => {
  console.log('Push notification received:', notification);
};

const onPushNotificationActionPerformed = (action) => {
  console.log('Push notification action performed:', action);
};

const onRegistrationSuccess = async (token) => {
  currentDeviceToken = token.value;

  if (!supabase || !currentUser?.id || !currentDeviceToken) return;

  try {
    const { error } = await supabase.from('device_tokens').upsert({
      user_id: currentUser.id,
      user_email: currentUser.email,
      token: currentDeviceToken,
      platform: Capacitor.getPlatform(),
      app_id: 'crmbyte',
      last_seen_at: new Date().toISOString()
    }, { onConflict: 'token' });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to store device token:', error);
  }
};

const onRegistrationError = (error) => {
  console.error('Push notification registration error:', error);
};

export const getDeviceToken = () => currentDeviceToken;

export const cleanupPushNotifications = async () => {
  await PushNotifications.removeAllListeners();
  listenersRegistered = false;
};
