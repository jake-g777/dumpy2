import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly ENCRYPTION_KEY = 'QOL0VSP9UfRSvZdlRkXvLiZB5b5lwn6HTPYb2i4dcak=';
  private static readonly ENCRYPTION_IV = 'GB8Fb9TwTSBvM6rtu0e3sw==';

  static encrypt(text: string): string {
    try {
      const key = CryptoJS.enc.Base64.parse(this.ENCRYPTION_KEY);
      const iv = CryptoJS.enc.Base64.parse(this.ENCRYPTION_IV);
      
      const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Convert to hex string and ensure even length
      const hexString = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
      return hexString.length % 2 === 0 ? hexString : '0' + hexString;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      if (!encryptedData) {
        return '';
      }

      // Convert hex string back to WordArray
      const hexString = encryptedData.startsWith('0x') ? encryptedData.slice(2) : encryptedData;
      const wordArray = CryptoJS.enc.Hex.parse(hexString);

      // Parse the key and IV
      const key = CryptoJS.enc.Base64.parse(this.ENCRYPTION_KEY);
      const iv = CryptoJS.enc.Base64.parse(this.ENCRYPTION_IV);

      // Create CipherParams object
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: wordArray
      });

      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(
        cipherParams,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
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

  static decryptConnectionData(data: {
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
      password: this.decrypt(data.password || ''),
      username: this.decrypt(data.username || ''),
      hostName: this.decrypt(data.hostName || ''),
      serviceName: this.decrypt(data.serviceName || '')
    };
  }
} 