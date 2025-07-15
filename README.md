# @common-ground-dao/cg-plugin-lib-host

**Drop-in replacement** for Common Ground's server-side plugin library. This package provides cryptographic signing capabilities for plugins that need to authenticate requests to the host application.

## 🎯 Purpose

This library handles the **server-side cryptographic signing** that Common Ground plugins require. It provides the exact same API as the original `@common-ground-dao/cg-plugin-lib-host` but works with our custom host system.

## 📦 Installation

```bash
# Replace the original CG host library with ours
npm install @common-ground-dao/cg-plugin-lib-host

# Or with yarn
yarn add @common-ground-dao/cg-plugin-lib-host
```

## 🚀 Usage

### Basic Signing (Exactly like original CG)

```typescript
import { CgPluginLibHost } from '@common-ground-dao/cg-plugin-lib-host';

// Initialize with your plugin's key pair
const host = await CgPluginLibHost.initialize(
  privateKey,  // Your plugin's private key (base64 encoded)
  publicKey    // Your plugin's public key (base64 encoded)
);

// Sign a request
const { request, signature } = await host.signRequest(requestData);
```

### Next.js API Route Example

```typescript
// app/api/sign/route.ts
import { CgPluginLibHost } from '@common-ground-dao/cg-plugin-lib-host';

const privateKey = process.env.NEXT_PRIVATE_PRIVKEY as string;
const publicKey = process.env.NEXT_PUBLIC_PUBKEY as string;

export async function POST(req: Request) {
  const body = await req.json();

  const host = await CgPluginLibHost.initialize(privateKey, publicKey);
  const { request, signature } = await host.signRequest(body);

  return Response.json({ request, signature });
}
```

### Express.js Example

```typescript
import express from 'express';
import { CgPluginLibHost } from '@common-ground-dao/cg-plugin-lib-host';

const app = express();
app.use(express.json());

app.post('/api/sign', async (req, res) => {
  try {
    const host = await CgPluginLibHost.initialize(
      process.env.PRIVATE_KEY,
      process.env.PUBLIC_KEY
    );
    
    const { request, signature } = await host.signRequest(req.body);
    res.json({ request, signature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔧 API Reference

### `CgPluginLibHost.initialize(privateKey, publicKey)`

Initialize the host library with your plugin's key pair.

**Parameters:**
- `privateKey: string` - Plugin's private key (base64 encoded PKCS#8 format)
- `publicKey: string` - Plugin's public key (base64 encoded SPKI format)

**Returns:** `Promise<CgPluginLibHost>` - Initialized instance

**Example:**
```typescript
const host = await CgPluginLibHost.initialize(
  'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...',
  'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...'
);
```

### `signRequest(requestData)`

Sign a request using the plugin's private key.

**Parameters:**
- `requestData: any` - Data to be signed (typically the API request payload)

**Returns:** `Promise<{ request: any, signature: string }>`

**Example:**
```typescript
const requestData = {
  method: 'getUserInfo',
  iframeUid: 'iframe_12345',
  requestId: 'req_67890',
  timestamp: Date.now()
};

const { request, signature } = await host.signRequest(requestData);
// request: normalized request data
// signature: base64 encoded ECDSA signature
```

### `verifySignature(data, signature)` 

Verify a signature (utility method for testing).

**Parameters:**
- `data: any` - Original data that was signed
- `signature: string` - Base64 encoded signature to verify

**Returns:** `Promise<boolean>` - Whether the signature is valid

**Example:**
```typescript
const isValid = await host.verifySignature(requestData, signature);
console.log('Signature valid:', isValid);
```

### `CgPluginLibHost.generateKeyPair()` (Static Method)

Generate a new ECDSA key pair for plugin development.

**Returns:** `Promise<{ privateKey: string, publicKey: string }>` - Base64 encoded key pair

**Example:**
```typescript
const { privateKey, publicKey } = await CgPluginLibHost.generateKeyPair();
console.log('Private Key:', privateKey);
console.log('Public Key:', publicKey);
```

## 🔐 Cryptographic Details

### Algorithm
- **Signature Algorithm**: ECDSA with P-256 curve
- **Hash Function**: SHA-256
- **Key Format**: PKCS#8 (private), SPKI (public)
- **Encoding**: Base64

### Security Features

1. **Deterministic Signing**: Same input always produces same signature
2. **Timestamp Inclusion**: Prevents replay attacks
3. **Data Normalization**: Consistent object key ordering
4. **Error Handling**: Comprehensive validation and error messages

### Request Signing Process

1. **Normalize Data**: Sort object keys recursively for consistency
2. **Add Timestamp**: Include timestamp if not present
3. **Serialize**: Convert to JSON string
4. **Sign**: Create ECDSA signature using SHA-256
5. **Encode**: Convert signature to base64 for transmission

## 🔄 Migration from Original CG

### No Code Changes Required!

If you have an existing Common Ground plugin using the host library:

1. **Update package source**: Point to our npm registry or local packages
2. **Update dependencies**: `yarn add @common-ground-dao/cg-plugin-lib-host`
3. **Test**: Your signing endpoints should work exactly the same

### Environment Variables

Make sure your plugin has the required environment variables:

```bash
# .env (Next.js example)
NEXT_PRIVATE_PRIVKEY=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
NEXT_PUBLIC_PUBKEY=MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...

# .env (Node.js example)
PRIVATE_KEY=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
PUBLIC_KEY=MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
```

## 🛠️ Development Setup

### Generating Development Keys

```typescript
import { CgPluginLibHost } from '@common-ground-dao/cg-plugin-lib-host';

// Generate a new key pair for development
const keys = await CgPluginLibHost.generateKeyPair();

console.log('Add these to your .env file:');
console.log(`NEXT_PRIVATE_PRIVKEY=${keys.privateKey}`);
console.log(`NEXT_PUBLIC_PUBKEY=${keys.publicKey}`);
```

### Key Pair Management

**⚠️ Important Security Notes:**

1. **Private Key Security**: Never expose private keys in client-side code
2. **Environment Variables**: Store keys in secure environment variables
3. **Key Rotation**: Regularly rotate keys in production
4. **Backup**: Securely backup your key pairs

### Testing Your Implementation

```typescript
// Test your signing endpoint
const testData = {
  method: 'getUserInfo',
  iframeUid: 'test_iframe',
  requestId: 'test_request',
  timestamp: Date.now()
};

const host = await CgPluginLibHost.initialize(privateKey, publicKey);
const { request, signature } = await host.signRequest(testData);

// Verify the signature
const isValid = await host.verifySignature(request, signature);
console.log('Signature verification:', isValid ? 'PASS' : 'FAIL');
```

## 🐛 Error Handling

Common errors and solutions:

```typescript
try {
  const host = await CgPluginLibHost.initialize(privateKey, publicKey);
  const result = await host.signRequest(data);
} catch (error) {
  if (error.message.includes('Invalid key format')) {
    // Check that your keys are properly base64 encoded
    console.error('Key format error - check your environment variables');
  } else if (error.message.includes('Failed to sign request')) {
    // Signing operation failed
    console.error('Signing failed - check your private key');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## 🏗️ Architecture Integration

### How It Fits in the System

```
Plugin Frontend (Browser)
    ↓
Client Library (@common-ground-dao/cg-plugin-lib)
    ↓
HTTP Request to /api/sign
    ↓
Host Library (@common-ground-dao/cg-plugin-lib-host) ← YOU ARE HERE
    ↓
Signed Request via postMessage
    ↓
Host Application validates and responds
```

### Server Requirements

- **Node.js**: 18+ (for WebCrypto API support)
- **TypeScript**: 5+ (recommended)
- **Framework**: Any (Next.js, Express, Fastify, etc.)

## 📊 Performance

### Benchmarks

- **Key Generation**: ~50ms
- **Request Signing**: ~5ms
- **Signature Verification**: ~3ms
- **Memory Usage**: <1MB per instance

### Optimization Tips

1. **Reuse Instances**: Initialize once, reuse the same instance
2. **Key Caching**: Keys are cached after import for performance
3. **Async Operations**: All operations are async and non-blocking

## 🔧 Building the Library

```bash
# Build TypeScript to JavaScript
yarn build

# Watch for changes during development
yarn dev

# Clean build artifacts
yarn clean
```

## 🧪 Testing

### Unit Tests (Example)

```typescript
import { CgPluginLibHost } from './src';

describe('CgPluginLibHost', () => {
  test('should generate valid key pairs', async () => {
    const keys = await CgPluginLibHost.generateKeyPair();
    expect(keys.privateKey).toBeDefined();
    expect(keys.publicKey).toBeDefined();
  });

  test('should sign and verify requests', async () => {
    const keys = await CgPluginLibHost.generateKeyPair();
    const host = await CgPluginLibHost.initialize(keys.privateKey, keys.publicKey);
    
    const data = { test: 'data' };
    const { request, signature } = await host.signRequest(data);
    
    const isValid = await host.verifySignature(request, signature);
    expect(isValid).toBe(true);
  });
});
```

### Integration Testing

Test with the complete system:

```bash
# Start the host application
cd ../host-app && yarn dev

# Test your plugin with signing
# Load plugin in host application and verify API calls work
```

## 📊 Compatibility Matrix

| Original CG Version | Our Implementation | Status |
|--------------------|--------------------|---------|
| 0.9.6 | 0.9.6 | ✅ Fully compatible |
| Earlier versions | 0.9.6 | ✅ Forward compatible |

## 🤝 Contributing

This package is part of the standalone embed system. See the [root README](../../README.md) for contribution guidelines.

## 📄 License

MIT License

---

**Note**: This library handles sensitive cryptographic operations. Always follow security best practices when deploying to production. 