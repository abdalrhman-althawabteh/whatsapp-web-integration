/**
 * Encryption Utilities
 * Handles encryption/decryption of sensitive WhatsApp session data
 * Uses AES-256-CBC encryption
 */

import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.warn('⚠️  WARNING: ENCRYPTION_KEY not set. Session data will not be encrypted!');
}

/**
 * Encrypt sensitive data
 * @param {string|object} data - Data to encrypt
 * @returns {string} Encrypted data
 */
export function encrypt(data) {
  if (!ENCRYPTION_KEY) {
    console.warn('Encryption key not available, storing data unencrypted');
    return typeof data === 'string' ? data : JSON.stringify(data);
  }

  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(dataString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted data
 * @param {string} encryptedData - Encrypted data
 * @param {boolean} parseJson - Whether to parse result as JSON
 * @returns {string|object} Decrypted data
 */
export function decrypt(encryptedData, parseJson = true) {
  if (!ENCRYPTION_KEY) {
    console.warn('Encryption key not available, returning data as-is');
    return parseJson ? JSON.parse(encryptedData) : encryptedData;
  }

  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      throw new Error('Decryption resulted in empty string');
    }

    return parseJson ? JSON.parse(decryptedString) : decryptedString;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a random encryption key
 * @param {number} length - Key length (default: 32)
 * @returns {string} Random key
 */
export function generateEncryptionKey(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let key = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    key += charset[randomIndex];
  }

  return key;
}

/**
 * Hash data using SHA256
 * @param {string} data - Data to hash
 * @returns {string} Hashed data
 */
export function hash(data) {
  return CryptoJS.SHA256(data).toString();
}

export default {
  encrypt,
  decrypt,
  generateEncryptionKey,
  hash,
};
