# Key Format Auto-Detection

Our `@common-ground-dao/cg-plugin-lib-host` library automatically detects and supports multiple key formats and algorithms for maximum developer convenience.

## Supported Key Formats

### 1. Raw Base64 (Most Common)
Simply paste the base64 string directly into your environment variables:

```bash
NEXT_PRIVATE_PRIVKEY=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
NEXT_PUBLIC_PUBKEY=MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
```

### 2. PEM Format (Also Supported)
Traditional PEM format with headers:

```bash
NEXT_PRIVATE_PRIVKEY="-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
-----END PRIVATE KEY-----"

NEXT_PUBLIC_PUBKEY="-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----"
```

## Supported Algorithms

### 1. ECDSA P-256 (Default)
- Our recommended algorithm
- Smaller key sizes
- Faster operations
- Perfect for modern applications

### 2. RSA-2048 (Common Ground Compatible)
- Compatible with original Common Ground plugins
- Larger key sizes
- Widely supported legacy algorithm

## Auto-Detection Logic

1. **Format Detection**: We detect PEM format by looking for `-----BEGIN` headers
2. **Format Conversion**: Raw base64 keys are automatically wrapped with PEM headers
3. **Algorithm Detection**: We try ECDSA P-256 first, then fall back to RSA-2048
4. **Error Handling**: Helpful error messages if neither format/algorithm works

## Example Usage

```typescript
import { CgPluginLibHost } from '@common-ground-dao/cg-plugin-lib-host';

// Works with ANY supported format!
const host = await CgPluginLibHost.initialize(
  process.env.NEXT_PRIVATE_PRIVKEY,  // Raw base64 or PEM
  process.env.NEXT_PUBLIC_PUBKEY     // Raw base64 or PEM
);

const { request, signature } = await host.signRequest(data);
```

## Migration from Original Common Ground

**No code changes required!** Your existing plugins will work exactly the same:

- RSA keys in PEM format ✅ Works perfectly
- ECDSA keys in base64 format ✅ Works perfectly  
- Mixed formats ✅ Auto-detected and handled

## Troubleshooting

If you get key import errors:

1. **Check format**: Ensure keys are valid base64 or PEM
2. **Remove quotes**: Environment variables shouldn't have quotes
3. **Match key pairs**: Ensure private and public keys correspond
4. **Check algorithm**: We support ECDSA P-256 and RSA-2048

## Detection Limitations

Our PEM detection looks for `-----BEGIN` headers. This heuristic works for 99% of cases but could theoretically fail with:
- Malformed keys containing `-----BEGIN` in base64 content
- Non-standard PEM variants

In practice, this is extremely rare and hasn't been observed in real usage.

## Debug Logging

Enable debug logging to see the detection process:

```
[CgPluginLibHost] Starting key import process...
[CgPluginLibHost] Private key length: 124
[CgPluginLibHost] Attempting ECDSA P-256 import...
[CgPluginLibHost] ECDSA P-256 import successful
[CgPluginLibHost] Keys imported successfully using ECDSA P-256 algorithm
```

This makes it easy to verify which format and algorithm were detected for your keys. 