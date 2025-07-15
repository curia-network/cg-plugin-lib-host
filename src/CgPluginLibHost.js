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
 * Main host library class for plugin request signing
 */
export class CgPluginLibHost {
    /**
     * Private constructor - use initialize() to create instances
     */
    constructor(privateKey, publicKey) {
        /** Cached crypto key objects for performance */
        this.cryptoPrivateKey = null;
        this.cryptoPublicKey = null;
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
    static async initialize(privateKey, publicKey) {
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
    async signRequest(requestData) {
        if (!this.cryptoPrivateKey) {
            throw new Error('Private key not imported. Call initialize() first.');
        }
        try {
            // Prepare the data for signing
            const dataToSign = this.prepareDataForSigning(requestData);
            // Convert data to bytes for signing
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(JSON.stringify(dataToSign));
            // Sign the data using ECDSA with SHA-256
            const signature = await webcrypto.subtle.sign({
                name: 'ECDSA',
                hash: { name: 'SHA-256' },
            }, this.cryptoPrivateKey, dataBytes);
            // Convert signature to base64 for transmission
            const signatureBase64 = this.arrayBufferToBase64(signature);
            console.log('[CgPluginLibHost] Request signed successfully');
            return {
                request: dataToSign,
                signature: signatureBase64,
            };
        }
        catch (error) {
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
    async verifySignature(data, signature) {
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
            // Verify the signature
            const isValid = await webcrypto.subtle.verify({
                name: 'ECDSA',
                hash: { name: 'SHA-256' },
            }, this.cryptoPublicKey, signatureBytes, dataBytes);
            return isValid;
        }
        catch (error) {
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
    static async generateKeyPair() {
        try {
            // Generate a new ECDSA key pair
            const keyPair = await webcrypto.subtle.generateKey({
                name: 'ECDSA',
                namedCurve: 'P-256',
            }, true, // extractable
            ['sign', 'verify']);
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
        }
        catch (error) {
            console.error('[CgPluginLibHost] Failed to generate key pair:', error);
            throw new Error(`Failed to generate key pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Import the private and public keys for crypto operations
     */
    async importKeys() {
        try {
            // Import private key
            const privateKeyBuffer = this.base64ToArrayBuffer(this.privateKey);
            this.cryptoPrivateKey = await webcrypto.subtle.importKey('pkcs8', privateKeyBuffer, {
                name: 'ECDSA',
                namedCurve: 'P-256',
            }, false, // not extractable
            ['sign']);
            // Import public key
            const publicKeyBuffer = this.base64ToArrayBuffer(this.publicKey);
            this.cryptoPublicKey = await webcrypto.subtle.importKey('spki', publicKeyBuffer, {
                name: 'ECDSA',
                namedCurve: 'P-256',
            }, false, // not extractable
            ['verify']);
            console.log('[CgPluginLibHost] Keys imported successfully');
        }
        catch (error) {
            console.error('[CgPluginLibHost] Failed to import keys:', error);
            throw new Error(`Failed to import keys: ${error instanceof Error ? error.message : 'Invalid key format'}`);
        }
    }
    /**
     * Prepare data for signing by normalizing and sorting
     *
     * This ensures consistent signing regardless of property order
     * and handles edge cases in the data structure.
     */
    prepareDataForSigning(data) {
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
    sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        }
        const sorted = {};
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
    arrayBufferToBase64(buffer) {
        return CgPluginLibHost.arrayBufferToBase64(buffer);
    }
    /**
     * Convert base64 string to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        // Use Node.js Buffer for proper base64 decoding
        const buffer = global.Buffer.from(base64, 'base64');
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
    /**
     * Static utility: Convert ArrayBuffer to base64 string
     */
    static arrayBufferToBase64(buffer) {
        // Use Node.js Buffer for proper base64 encoding
        const nodeBuffer = global.Buffer.from(buffer);
        return nodeBuffer.toString('base64');
    }
}
//# sourceMappingURL=CgPluginLibHost.js.map