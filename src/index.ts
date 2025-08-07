/**
 * @common-ground-dao/cg-plugin-lib-host
 * 
 * Drop-in replacement for Common Ground's plugin host library.
 * 
 * This module provides server-side cryptographic signing capabilities
 * for plugins that need to authenticate requests to the host application.
 * 
 * Usage (exactly like the original):
 * ```typescript
 * import { CgPluginLibHost } from '@common-ground-dao/cg-plugin-lib-host';
 * 
 * // Initialize with plugin's key pair
 * const host = await CgPluginLibHost.initialize(privateKey, publicKey);
 * 
 * // Sign a request
 * const { request, signature } = await host.signRequest(requestData);
 * ```
 */

// Export the main host library class
export { CgPluginLibHost } from './CgPluginLibHost.js';

// Export shared types that developers need (same as client library)
export type {
  ApiResponse,
  UserInfoResponsePayload,
  CommunityInfoResponsePayload,
  UserFriendsResponsePayload,
  IrcCredentials,
  MessageType,
  HostMessage,
  PluginConfig,
} from './types.js';

/**
 * Default export for backwards compatibility
 * Some plugins might use: import CgPluginLibHost from '@common-ground-dao/cg-plugin-lib-host'
 */
import { CgPluginLibHost } from './CgPluginLibHost.js';
export default CgPluginLibHost; 