const PRIVATE_KEY_STORAGE = "vibetalk_private_key";
const PUBLIC_KEY_STORAGE = "vibetalk_public_key";

class CryptoService {
  /**
   * Generate RSA-OAEP key pair
   * @returns {{ publicKeyJwk: string, privateKeyJwk: string }}
   */
  async generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"],
    );

    const publicKeyJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey,
    );
    const privateKeyJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey,
    );

    const publicKeyStr = JSON.stringify(publicKeyJwk);
    const privateKeyStr = JSON.stringify(privateKeyJwk);

    // Save to localStorage
    localStorage.setItem(PRIVATE_KEY_STORAGE, privateKeyStr);
    localStorage.setItem(PUBLIC_KEY_STORAGE, publicKeyStr);

    return { publicKeyJwk: publicKeyStr, privateKeyJwk: privateKeyStr };
  }

  /**
   * Check if user has key pair stored locally
   */
  hasKeyPair() {
    return (
      !!localStorage.getItem(PRIVATE_KEY_STORAGE) &&
      !!localStorage.getItem(PUBLIC_KEY_STORAGE)
    );
  }

  /**
   * Get stored public key string (to send to server)
   */
  getStoredPublicKey() {
    return localStorage.getItem(PUBLIC_KEY_STORAGE);
  }

  /**
   * Import RSA public key from JWK string (for encrypting)
   */
  async importPublicKey(publicKeyStr) {
    const jwk = JSON.parse(publicKeyStr);
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"],
    );
  }

  /**
   * Import RSA private key from localStorage (for decrypting)
   */
  async getPrivateKey() {
    const privateKeyStr = localStorage.getItem(PRIVATE_KEY_STORAGE);
    if (!privateKeyStr) {
      throw new Error("No private key found. Please re-login.");
    }
    const jwk = JSON.parse(privateKeyStr);
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"],
    );
  }

  /**
   * Generate random AES-GCM key
   */
  async generateAESKey() {
    return await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true, // extractable (need to encrypt it with RSA)
      ["encrypt", "decrypt"],
    );
  }

  /**
   * Encrypt message for a recipient
   * @param {string} plainText - Message content
   * @param {string} recipientPublicKeyStr - Recipient's public key (JWK string)
   * @returns {{ encryptedContent: string, encryptedKey: string, iv: string }}
   */
  async encryptMessage(plainText, recipientPublicKeyStr) {
    // 1. Generate random AES key
    const aesKey = await this.generateAESKey();

    // 2. AES encrypt the message
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(plainText);
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encodedText,
    );

    // 3. Export AES key as raw bytes
    const rawAESKey = await window.crypto.subtle.exportKey("raw", aesKey);

    // 4. RSA encrypt the AES key with recipient's public key
    const recipientPublicKey = await this.importPublicKey(
      recipientPublicKeyStr,
    );
    const encryptedKey = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      recipientPublicKey,
      rawAESKey,
    );

    // 5. Convert to base64 for transport
    return {
      encryptedContent: this.arrayBufferToBase64(encryptedContent),
      encryptedKey: this.arrayBufferToBase64(encryptedKey),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  /**
   * Encrypt message for multiple recipients (group chat)
   * @param {string} plainText
   * @param {Array<{userId: number, publicKey: string}>} recipients
   * @returns {{ encryptedContent: string, iv: string, encryptedKeys: {[userId]: string} }}
   */
  async encryptForGroup(plainText, recipients) {
    // 1. Generate random AES key
    const aesKey = await this.generateAESKey();

    // 2. AES encrypt the message
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(plainText);
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encodedText,
    );

    // 3. Export AES key
    const rawAESKey = await window.crypto.subtle.exportKey("raw", aesKey);

    // 4. RSA encrypt AES key for each recipient
    const encryptedKeys = {};
    for (const recipient of recipients) {
      if (recipient.publicKey) {
        const publicKey = await this.importPublicKey(recipient.publicKey);
        const encKey = await window.crypto.subtle.encrypt(
          { name: "RSA-OAEP" },
          publicKey,
          rawAESKey,
        );
        encryptedKeys[recipient.userId] = this.arrayBufferToBase64(encKey);
      }
    }

    return {
      encryptedContent: this.arrayBufferToBase64(encryptedContent),
      iv: this.arrayBufferToBase64(iv),
      encryptedKeys,
    };
  }

  /**
   * Decrypt a message
   * @param {string} encryptedContentB64 - Base64 encrypted content
   * @param {string} encryptedKeyB64 - Base64 RSA-encrypted AES key
   * @param {string} ivB64 - Base64 IV
   * @returns {string} Decrypted plain text
   */
  async decryptMessage(encryptedContentB64, encryptedKeyB64, ivB64) {
    try {
      // 1. Get private key
      const privateKey = await this.getPrivateKey();

      // 2. RSA decrypt AES key
      const encryptedKey = this.base64ToArrayBuffer(encryptedKeyB64);
      const rawAESKey = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedKey,
      );

      // 3. Import AES key
      const aesKey = await window.crypto.subtle.importKey(
        "raw",
        rawAESKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"],
      );

      // 4. AES decrypt content
      const iv = this.base64ToArrayBuffer(ivB64);
      const encryptedContent = this.base64ToArrayBuffer(encryptedContentB64);
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encryptedContent,
      );

      return new TextDecoder().decode(decryptedContent);
    } catch (error) {
      console.error("Decryption failed:", error);
      return "[Unable to decrypt message]";
    }
  }

  /**
   * Check if content is E2EE encrypted (has our format marker)
   */
  isEncrypted(content) {
    if (!content) return false;
    try {
      const parsed = JSON.parse(content);
      return parsed._e2ee === true;
    } catch {
      return false;
    }
  }

  /**
   * Parse encrypted message content string
   */
  parseEncryptedContent(content) {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  // ===== Helpers =====

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Clear stored keys (on logout)
   */
  clearKeys() {
    localStorage.removeItem(PRIVATE_KEY_STORAGE);
    localStorage.removeItem(PUBLIC_KEY_STORAGE);
  }
}

const cryptoService = new CryptoService();
export default cryptoService;
