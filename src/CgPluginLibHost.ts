/**
 * CgPluginLibHost - Server-side library for Common Ground Plugin system
 * 
 * This class provides the EXACT same interface as @common-ground-dao/cg-plugin-lib-host
 * to ensure seamless compatibility with existing plugins.
 * 
 * Key responsibilities:
 * 1. Sign plugin requests using private/public key cryptography
 * 2. Provide request validation utilities
 * 3. Handle plugin authentication flow
 * 
 * This runs on the plugin's server (e.g., in Next.js API routes) and is used
 * to create cryptographic signatures for requests to the host application.
 */

import { webcrypto } from 'node:crypto';

/**
 * Request signing result interface
 */
interface SignRequestResult {
  /** The original or modified request data */
  request: any;
  /** Cryptographic signature for the request */
  signature: string;
}

/**
 * Main host library class for plugin request signing
 */
export class CgPluginLibHost {
  /** Plugin's private key for signing (base64 encoded) */
  private privateKey: string;
  
  /** Plugin's public key for verification (base64 encoded) */
  private publicKey: string;
  
  /** Cached crypto key objects for performance */
  private cryptoPrivateKey: CryptoKey | null = null;
  private cryptoPublicKey: CryptoKey | null = null;
  
  /** Detected algorithm for crypto operations */
  private algorithm: string | null = null;

  /**
   * Private constructor - use initialize() to create instances
   */
  private constructor(privateKey: string, publicKey: string) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  /**
   * Initialize the host library - MUST match original CG interface exactly
   * 
   * @param privateKey - Plugin's private key (base64 encoded)
   * @param publicKey - Plugin's public key (base64 encoded)
   * @returns Promise<CgPluginLibHost> - Initialized instance
   */
  public static async initialize(
    privateKey: string,
    publicKey: string
  ): Promise<CgPluginLibHost> {
    const instance = new CgPluginLibHost(privateKey, publicKey);
    
    // Import the keys for crypto operations
    await instance.importKeys();
    
    console.log('[CgPluginLibHost] Initialized with key pair');
    
    return instance;
  }

  /**
   * Sign a request - MUST match original CG interface exactly
   * 
   * This creates a cryptographic signature for the request data that
   * the host application can verify using the plugin's public key.
   * 
   * @param requestData - Data to be signed
   * @returns Promise<SignRequestResult> - Signed request with signature
   */
  public async signRequest(requestData: any): Promise<SignRequestResult> {
    if (!this.cryptoPrivateKey) {
      throw new Error('Private key not imported. Call initialize() first.');
    }

    try {
      // Prepare the data for signing
      const dataToSign = this.prepareDataForSigning(requestData);
      
      // Convert data to bytes for signing
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(JSON.stringify(dataToSign));
      
      // Sign the data using detected algorithm
      const signatureAlgorithm = this.getSignatureAlgorithm();
      console.log(`[CgPluginLibHost] Signing request using ${this.algorithm} algorithm`);
      
      const signature = await webcrypto.subtle.sign(
        signatureAlgorithm,
        this.cryptoPrivateKey,
        dataBytes
      );
      
      // Convert signature to base64 for transmission
      const signatureBase64 = this.arrayBufferToBase64(signature);
      
      console.log('[CgPluginLibHost] Request signed successfully');
      
      return {
        request: dataToSign,
        signature: signatureBase64,
      };
    } catch (error) {
      console.error('[CgPluginLibHost] Failed to sign request:', error);
      throw new Error(`Failed to sign request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a signature (utility method for testing)
   * 
   * @param data - Original data that was signed
   * @param signature - Base64 encoded signature
   * @returns Promise<boolean> - Whether the signature is valid
   */
  public async verifySignature(data: any, signature: string): Promise<boolean> {
    if (!this.cryptoPublicKey) {
      throw new Error('Public key not imported. Call initialize() first.');
    }

    try {
      // Prepare the same data that was signed
      const dataToVerify = this.prepareDataForSigning(data);
      
      // Convert data to bytes
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(JSON.stringify(dataToVerify));
      
      // Convert signature from base64
      const signatureBytes = this.base64ToArrayBuffer(signature);
      
      // Verify the signature using detected algorithm
      const signatureAlgorithm = this.getSignatureAlgorithm();
      const isValid = await webcrypto.subtle.verify(
        signatureAlgorithm,
        this.cryptoPublicKey,
        signatureBytes,
        dataBytes
      );
      
      return isValid;
    } catch (error) {
      console.error('[CgPluginLibHost] Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * Generate a new key pair for plugin development
   * 
   * This is a utility method for developers to generate new key pairs
   * for their plugins during development.
   * 
   * @returns Promise<{privateKey: string, publicKey: string}> - Base64 encoded key pair
   */
  public static async generateKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
    try {
      // Generate a new ECDSA key pair
      const keyPair = await webcrypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true, // extractable
        ['sign', 'verify']
      );

      // Export the private key
      const privateKeyBuffer = await webcrypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKeyBase64 = CgPluginLibHost.arrayBufferToBase64(privateKeyBuffer);

      // Export the public key
      const publicKeyBuffer = await webcrypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyBase64 = CgPluginLibHost.arrayBufferToBase64(publicKeyBuffer);

      console.log('[CgPluginLibHost] Generated new key pair');

      return {
        privateKey: privateKeyBase64,
        publicKey: publicKeyBase64,
      };
    } catch (error) {
      console.error('[CgPluginLibHost] Failed to generate key pair:', error);
      throw new Error(`Failed to generate key pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import the private and public keys for crypto operations
   * Supports both ECDSA P-256 and RSA algorithms with auto-detection
   */
  private async importKeys(): Promise<void> {
    try {
      console.log('[CgPluginLibHost] Starting key import process...');
      console.log('[CgPluginLibHost] Private key length:', this.privateKey.length);
      console.log('[CgPluginLibHost] Public key length:', this.publicKey.length);
      console.log('[CgPluginLibHost] Private key starts with:', this.privateKey.substring(0, 30));
      console.log('[CgPluginLibHost] Public key starts with:', this.publicKey.substring(0, 30));

      // Auto-detect and convert key format
      const privateKeyPem = this.ensurePemFormat(this.privateKey, 'PRIVATE KEY');
      const publicKeyPem = this.ensurePemFormat(this.publicKey, 'PUBLIC KEY');

      console.log('[CgPluginLibHost] Converted to PEM format successfully');
      console.log('[CgPluginLibHost] Private key PEM starts with:', privateKeyPem.substring(0, 50));
      console.log('[CgPluginLibHost] Public key PEM starts with:', publicKeyPem.substring(0, 50));

             // Try to import keys with algorithm auto-detection
       const { privateKey, publicKey, algorithm } = await this.importKeysWithDetection(privateKeyPem, publicKeyPem);
       
       this.cryptoPrivateKey = privateKey;
       this.cryptoPublicKey = publicKey;
       this.algorithm = algorithm;

       console.log(`[CgPluginLibHost] Keys imported successfully using ${algorithm} algorithm`);
    } catch (error) {
      console.error('[CgPluginLibHost] Failed to import keys:', error);
      const errorMessage = this.createHelpfulKeyError(error instanceof Error ? error.message : 'Unknown error');
      throw new Error(errorMessage);
    }
  }

  /**
   * Prepare data for signing by normalizing and sorting
   * 
   * This ensures consistent signing regardless of property order
   * and handles edge cases in the data structure.
   */
  private prepareDataForSigning(data: any): any {
    // Add timestamp if not present to prevent replay attacks
    const dataWithTimestamp = {
      ...data,
      timestamp: data.timestamp || Date.now(),
    };

    // Sort object keys recursively for consistent signing
    return this.sortObjectKeys(dataWithTimestamp);
  }

  /**
   * Recursively sort object keys for consistent serialization
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach(key => {
        sorted[key] = this.sortObjectKeys(obj[key]);
      });

    return sorted;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    return CgPluginLibHost.arrayBufferToBase64(buffer);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    // Use Node.js Buffer for proper base64 decoding
    const buffer = global.Buffer.from(base64, 'base64');
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  /**
   * Static utility: Convert ArrayBuffer to base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    // Use Node.js Buffer for proper base64 encoding
    const nodeBuffer = global.Buffer.from(buffer);
    return nodeBuffer.toString('base64');
  }

  /**
   * Ensure key is in PEM format (add headers if missing)
   */
  private ensurePemFormat(key: string, keyType: 'PRIVATE KEY' | 'PUBLIC KEY'): string {
    // Remove any existing whitespace/newlines
    const cleanKey = key.replace(/\s/g, '');
    
    // If already in PEM format, return as-is
    if (cleanKey.includes('-----BEGIN')) {
      return key;
    }
    
    // Convert raw base64 to PEM format
    const header = `-----BEGIN ${keyType}-----`;
    const footer = `-----END ${keyType}-----`;
    
    // Split base64 into 64-character lines
    const formattedKey = cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey;
    
    return `${header}\n${formattedKey}\n${footer}`;
  }

  /**
   * Convert PEM format key to ArrayBuffer
   */
  private pemToArrayBuffer(pem: string): ArrayBuffer {
    // Extract base64 content between headers
    const base64 = pem
      .replace(/-----BEGIN [^-]+-----/, '')
      .replace(/-----END [^-]+-----/, '')
      .replace(/\s/g, '');
    
    // Convert to ArrayBuffer
    const buffer = global.Buffer.from(base64, 'base64');
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  /**
   * Import keys with algorithm auto-detection
   * Tries ECDSA first (most common), then RSA for Common Ground compatibility
   */
  private async importKeysWithDetection(privateKeyPem: string, publicKeyPem: string): Promise<{
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    algorithm: string;
  }> {
    const privateKeyBuffer = this.pemToArrayBuffer(privateKeyPem);
    const publicKeyBuffer = this.pemToArrayBuffer(publicKeyPem);

    // Try ECDSA P-256 first (our default)
    try {
      console.log('[CgPluginLibHost] Attempting ECDSA P-256 import...');
      
      const privateKey = await webcrypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        false,
        ['sign']
      );

      const publicKey = await webcrypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        false,
        ['verify']
      );

      console.log('[CgPluginLibHost] ECDSA P-256 import successful');
      return { privateKey, publicKey, algorithm: 'ECDSA P-256' };
    } catch (ecdsaError) {
      console.log('[CgPluginLibHost] ECDSA P-256 import failed, trying RSA...');
    }

    // Try RSA (for Common Ground compatibility)
    try {
      console.log('[CgPluginLibHost] Attempting RSA-2048 import...');
      
      const privateKey = await webcrypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );

      const publicKey = await webcrypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['verify']
      );

      console.log('[CgPluginLibHost] RSA-2048 import successful');
      return { privateKey, publicKey, algorithm: 'RSA-2048' };
    } catch (rsaError) {
      console.log('[CgPluginLibHost] RSA-2048 import failed');
      throw new Error('Unable to import keys as either ECDSA P-256 or RSA-2048');
    }
  }

     /**
    * Create helpful error message for key import failures
    */
   private createHelpfulKeyError(originalError: string): string {
     return `Failed to import cryptographic keys: ${originalError}

Key Format Help:
Our library auto-detects and supports both formats:

1. Raw Base64 (most common):
   NEXT_PRIVATE_PRIVKEY=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49...

2. PEM Format (also supported):
   NEXT_PRIVATE_PRIVKEY="-----BEGIN PRIVATE KEY-----\\nMIGH...\\n-----END PRIVATE KEY-----"

Troubleshooting:
- Ensure your keys are either raw base64 or PEM format with headers
- Check that private and public keys match and are valid
- Supported algorithms: ECDSA P-256, RSA-2048
- Remove any quotes around environment variables if present

Detection Logic: We detect PEM by looking for '-----BEGIN' headers. 
This heuristic works for 99% of cases but could fail with malformed keys.`;
   }

   /**
    * Get the appropriate signature algorithm based on detected key type
    */
   private getSignatureAlgorithm(): EcdsaParams | RsaPssParams | Algorithm {
     if (!this.algorithm) {
       throw new Error('No algorithm detected. Keys may not be imported yet.');
     }

     if (this.algorithm.includes('ECDSA')) {
       return {
         name: 'ECDSA',
         hash: 'SHA-256',
       } as EcdsaParams;
     } else if (this.algorithm.includes('RSA')) {
       return {
         name: 'RSASSA-PKCS1-v1_5',
       } as Algorithm;
     } else {
       throw new Error(`Unsupported algorithm for signing: ${this.algorithm}`);
     }
   }
} 