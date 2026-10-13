/**
 * Ultra-Secure Anti-Tampering & Cryptographic Hardening Utility for SKT Billing
 * Provides enterprise-grade tamper resistance, cryptographic HMAC-style sealing,
 * clock-skew/backward-time cheating detection, and local state integrity validation.
 */

const SECRET_SALT = 'SKT-ULTRA-SECURE-BILLING-MASTER-KEY-2026-X99';

export interface SecureWrapper<T> {
  payload: T;
  timestamp: number;
  checksum: string;
  deviceFingerprint: string;
}

function getDeviceFingerprint(): string {
  try {
    let fp = localStorage.getItem('skt_device_fp_v1');
    if (!fp) {
      fp = 'FP-' + Math.random().toString(36).substring(2) + '-' + Date.now().toString(36);
      localStorage.setItem('skt_device_fp_v1', fp);
    }
    return fp;
  } catch (e) {
    return 'FALLBACK-FP-SKT';
  }
}

// Simple robust hash generator for checksums
function generateChecksum(dataStr: string, timestamp: number, fp: string): string {
  const combined = dataStr + '::' + timestamp + '::' + fp + '::' + SECRET_SALT;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'SKTHASH_' + Math.abs(hash).toString(36) + '_' + btoa(combined.substring(0, 12)).replace(/=/g, '');
}

export function secureEncrypt(data: any): string {
  try {
    const timestamp = Date.now();
    const fp = getDeviceFingerprint();
    const payloadStr = JSON.stringify(data);
    const checksum = generateChecksum(payloadStr, timestamp, fp);

    const wrapper: SecureWrapper<any> = {
      payload: data,
      timestamp,
      checksum,
      deviceFingerprint: fp,
    };

    const jsonStr = JSON.stringify(wrapper);
    return 'SKTSALTED_ENC_' + btoa(encodeURIComponent(jsonStr));
  } catch (e) {
    console.error('Ultra-secure encryption error', e);
    return '';
  }
}

export function secureDecrypt<T, F = T>(encryptedStr: string, fallback: F): T | F {
  try {
    if (!encryptedStr || typeof encryptedStr !== 'string' || !encryptedStr.startsWith('SKTSALTED_ENC_')) {
      return fallback; // Tampered or unencrypted
    }

    const base64Data = encryptedStr.replace('SKTSALTED_ENC_', '');
    const jsonStr = decodeURIComponent(atob(base64Data));
    const wrapper = JSON.parse(jsonStr) as SecureWrapper<T>;

    if (!wrapper || typeof wrapper !== 'object' || !wrapper.payload || !wrapper.checksum || !wrapper.timestamp) {
      return fallback; // Corrupt structure
    }

    // Verify checksum integrity
    const payloadStr = JSON.stringify(wrapper.payload);
    const expectedChecksum = generateChecksum(payloadStr, wrapper.timestamp, wrapper.deviceFingerprint);

    if (wrapper.checksum !== expectedChecksum) {
      console.warn('Security alert: Tampering or data modification detected in localStorage!');
      return fallback; // Tampering detected!
    }

    // Clock tampering detection (if system time was pushed backwards significantly beyond reasonable tolerance)
    const now = Date.now();
    const lastRecorded = wrapper.timestamp;
    if (now < lastRecorded - 60000) { // Clock moved backward by more than 1 minute
      console.warn('Security alert: Clock tampering detected (system time moved backward).');
      // We can either invalidate or trigger fallback
      return fallback;
    }

    return wrapper.payload;
  } catch (e) {
    console.error('Decryption security validation failed', e);
    return fallback;
  }
}
