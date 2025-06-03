import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-fallback-key';

  static encrypt(text: string): string {
    try {
      return CryptoJS.AES.encrypt(text, this.ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  static decrypt(encryptedText: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  static encryptConnectionData(connectionData: {
    password: string;
    username: string;
    hostName: string;
    serviceName: string;
  }): {
    encryptedPassword: string;
    encryptedUsername: string;
    encryptedHostName: string;
    encryptedServiceName: string;
  } {
    return {
      encryptedPassword: this.encrypt(connectionData.password),
      encryptedUsername: this.encrypt(connectionData.username),
      encryptedHostName: this.encrypt(connectionData.hostName),
      encryptedServiceName: this.encrypt(connectionData.serviceName),
    };
  }

  static decryptConnectionData(encryptedData: {
    password: string;
    username: string;
    hostName: string;
    serviceName: string;
  }): {
    password: string;
    username: string;
    hostName: string;
    serviceName: string;
  } {
    return {
      password: this.decrypt(encryptedData.password),
      username: this.decrypt(encryptedData.username),
      hostName: this.decrypt(encryptedData.hostName),
      serviceName: this.decrypt(encryptedData.serviceName),
    };
  }
} 