/**
 * Type definitions for Common Ground Plugin Host Library
 * 
 * These types MUST match the original @common-ground-dao/cg-plugin-lib-host exactly
 * to ensure drop-in compatibility with existing plugins.
 * 
 * Note: These are the same types as in the client library for convenience.
 */

/**
 * Standard API response wrapper used by all plugin API methods
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

/**
 * User information payload containing profile and authentication data
 */
export interface UserInfoResponsePayload {
  /** Unique user identifier */
  id: string;
  /** Display name */
  name: string;
  /** Email address (optional) */
  email?: string;
  /** Array of role IDs assigned to this user */
  roles: string[];
  /** Twitter/X account connection */
  twitter?: { 
    username: string; 
  };
  /** LUKSO account connection */
  lukso?: { 
    username: string; 
  };
  /** Farcaster account connection */
  farcaster?: { 
    username: string; 
  };
}

/**
 * Community information including available roles and permissions
 */
export interface CommunityInfoResponsePayload {
  /** Unique community identifier */
  id: string;
  /** Community display name */
  title: string;
  /** Optional community description */
  description?: string;
  /** Array of roles available in this community */
  roles: Array<{
    /** Unique role identifier */
    id: string;
    /** Role display name */
    title: string;
    /** Optional role description */
    description?: string;
    /** Rules governing how this role can be assigned */
    assignmentRules?: {
      /** Type of assignment rule */
      type: string;
      /** Additional requirements (varies by type) */
      requirements?: any;
    } | null;
  }>;
}

/**
 * User friends/connections list
 */
export interface UserFriendsResponsePayload {
  /** Array of friend/connection data */
  friends: Array<{
    /** Friend's unique identifier */
    id: string;
    /** Friend's display name */
    name: string;
    /** Friend's profile image URL */
    imageUrl: string;
  }>;
}

/**
 * IRC credentials response payload for chat functionality
 */
export interface IrcCredentials {
  /** Whether IRC provisioning was successful */
  success: boolean;
  /** IRC username for The Lounge client */
  ircUsername: string;
  /** IRC password for The Lounge client */
  ircPassword: string;
  /** IRC network name */
  networkName: string;
}

/**
 * Internal message types for host communication
 * These handle the postMessage protocol between plugin and host
 */
export enum MessageType {
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response',
  INIT = 'init',
  ERROR = 'error'
}

/**
 * Standard message format for plugin-host communication
 */
export interface HostMessage {
  /** Message type identifier */
  type: MessageType;
  /** Unique iframe identifier */
  iframeUid: string;
  /** Unique request identifier for correlation */
  requestId: string;
  /** API method name (for requests) */
  method?: string;
  /** Method parameters (for requests) */
  params?: any;
  /** Response data (for responses) */
  data?: any;
  /** Error message (for error responses) */
  error?: string;
  /** Cryptographic signature for request validation */
  signature?: string;
}

/**
 * Plugin configuration used during initialization
 */
export interface PluginConfig {
  /** Unique iframe identifier from URL parameters */
  iframeUid: string;
  /** Plugin's signing endpoint for request authentication */
  signEndpoint: string;
  /** Plugin's public key for signature verification */
  publicKey: string;
} 