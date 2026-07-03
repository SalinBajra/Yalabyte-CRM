import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { AccessControl, NativeBiometric } from '@capgo/capacitor-native-biometric';

const BIOMETRIC_SERVER = 'crm.yalabyte.com';
const REMEMBERED_EMAIL_KEY = 'crmbyte-remembered-email';
const BIOMETRIC_EMAIL_KEY = 'crmbyte-biometric-email';

export const isNativeApp = () => Capacitor.isNativePlatform();

function biometricLabel(type) {
  if (type === 2 || type === 4) return 'Face ID';
  if (type === 1 || type === 3) return 'fingerprint';
  return 'biometric unlock';
}

export async function getRememberedEmail() {
  if (isNativeApp()) {
    const { value } = await Preferences.get({ key: REMEMBERED_EMAIL_KEY });
    return value || '';
  }
  return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
}

export async function rememberEmail(email) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  if (isNativeApp()) {
    await Preferences.set({ key: REMEMBERED_EMAIL_KEY, value: normalized });
    return;
  }
  window.localStorage.setItem(REMEMBERED_EMAIL_KEY, normalized);
}

export async function getBiometricStatus() {
  if (!isNativeApp()) return { available: false, enabled: false, label: 'biometric unlock' };
  try {
    const result = await NativeBiometric.isAvailable({ useFallback: true });
    const { value } = await Preferences.get({ key: BIOMETRIC_EMAIL_KEY });
    return {
      available: Boolean(result.isAvailable),
      enabled: Boolean(result.isAvailable && value),
      email: value || '',
      label: biometricLabel(result.biometryType)
    };
  } catch {
    return { available: false, enabled: false, label: 'biometric unlock' };
  }
}

export async function saveBiometricCredentials(email, password) {
  if (!isNativeApp() || !email || !password) return false;
  const status = await getBiometricStatus();
  if (!status.available) return false;
  await NativeBiometric.verifyIdentity({
    reason: 'Enable quick access to CRMByte',
    title: 'Enable CRMByte unlock',
    subtitle: 'Use your device unlock next time',
    description: 'Your CRM password is stored securely on this device.',
    useFallback: true,
    maxAttempts: 3
  });
  await NativeBiometric.setCredentials({
    username: email.trim().toLowerCase(),
    password,
    server: BIOMETRIC_SERVER,
    accessControl: AccessControl.BIOMETRY_ANY,
    title: 'Protect CRMByte login',
    negativeButtonText: 'Cancel'
  });
  await Preferences.set({ key: BIOMETRIC_EMAIL_KEY, value: email.trim().toLowerCase() });
  await rememberEmail(email);
  return true;
}

export async function readBiometricCredentials() {
  if (!isNativeApp()) return null;
  const status = await getBiometricStatus();
  if (!status.enabled) return null;
  return NativeBiometric.getSecureCredentials({
    server: BIOMETRIC_SERVER,
    reason: 'Unlock CRMByte',
    title: 'Unlock CRMByte',
    subtitle: status.email,
    description: 'Use your device unlock to sign in.',
    negativeButtonText: 'Use password'
  });
}

export async function deleteBiometricCredentials() {
  if (!isNativeApp()) return;
  await NativeBiometric.deleteCredentials({ server: BIOMETRIC_SERVER }).catch(() => {});
  await Preferences.remove({ key: BIOMETRIC_EMAIL_KEY });
}
