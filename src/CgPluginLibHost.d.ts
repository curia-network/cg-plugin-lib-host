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
export declare class CgPluginLibHost {
    /** Plugin's private key for signing (base64 encoded) */
    private privateKey;
    /** Plugin's public key for verification (base64 encoded) */
    private publicKey;
    /** Cached crypto key objects for performance */
    private cryptoPrivateKey;
    private cryptoPublicKey;
    /**
     * Private constructor - use initialize() to create instances
     */
    private constructor();
    /**
     * Initialize the host library - MUST match original CG interface exactly
     *
     * @param privateKey - Plugin's private key (base64 encoded)
     * @param publicKey - Plugin's public key (base64 encoded)
     * @returns Promise<CgPluginLibHost> - Initialized instance
     */
    static initialize(privateKey: string, publicKey: string): Promise<CgPluginLibHost>;
    /**
     * Sign a request - MUST match original CG interface exactly
     *
     * This creates a cryptographic signature for the request data that
     * the host application can verify using the plugin's public key.
     *
     * @param requestData - Data to be signed
     * @returns Promise<SignRequestResult> - Signed request with signature
     */
    signRequest(requestData: any): Promise<SignRequestResult>;
    /**
     * Verify a signature (utility method for testing)
     *
     * @param data - Original data that was signed
     * @param signature - Base64 encoded signature
     * @returns Promise<boolean> - Whether the signature is valid
     */
    verifySignature(data: any, signature: string): Promise<boolean>;
    /**
     * Generate a new key pair for plugin development
     *
     * This is a utility method for developers to generate new key pairs
     * for their plugins during development.
     *
     * @returns Promise<{privateKey: string, publicKey: string}> - Base64 encoded key pair
     */
    static generateKeyPair(): Promise<{
        privateKey: string;
        publicKey: string;
    }>;
    /**
     * Import the private and public keys for crypto operations
     */
    private importKeys;
    /**
     * Prepare data for signing by normalizing and sorting
     *
     * This ensures consistent signing regardless of property order
     * and handles edge cases in the data structure.
     */
    private prepareDataForSigning;
    /**
     * Recursively sort object keys for consistent serialization
     */
    private sortObjectKeys;
    /**
     * Convert ArrayBuffer to base64 string
     */
    private arrayBufferToBase64;
    /**
     * Convert base64 string to ArrayBuffer
     */
    private base64ToArrayBuffer;
    /**
     * Static utility: Convert ArrayBuffer to base64 string
     */
    private static arrayBufferToBase64;
}
export {};
//# sourceMappingURL=CgPluginLibHost.d.ts.map