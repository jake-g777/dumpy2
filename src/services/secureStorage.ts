import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'dumpy_db_connections';
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-fallback-key';

interface StorageData {
  timestamp: number;
  data: string;
}

export const secureStorage = {
  // Encrypt data before storing
  encrypt: (data: any): string => {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  },

  // Decrypt stored data
  decrypt: (encryptedData: string): any => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  },

  // Store encrypted data with timestamp
  setItem: (data: any): void => {
    const storageData: StorageData = {
      timestamp: Date.now(),
      data: secureStorage.encrypt(data)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  },

  // Retrieve and decrypt data, checking timestamp
  getItem: (): any | null => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (!storedData) return null;

      const { timestamp, data }: StorageData = JSON.parse(storedData);
      
      // Check if data is older than 24 hours
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        secureStorage.removeItem();
        return null;
      }

      return secureStorage.decrypt(data);
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  },

  // Remove stored data
  removeItem: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export default secureStorage; 