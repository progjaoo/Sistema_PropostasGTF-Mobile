---
name: Mobile SecureStore platform split
description: expo-secure-store is native-only; use platform-specific files so Metro can bundle for web too
---

# Mobile SecureStore Platform Split

## Rule
`expo-secure-store` only works on iOS/Android — it cannot be bundled by Metro for web. Any file that imports it directly will fail on the web target.

**Why:** Metro throws "Unable to resolve 'expo-secure-store'" when bundling for web because the package has no web implementation.

## How to apply
Use a platform-specific file pair in `artifacts/mobile/src/utils/`:
- `secureStorage.native.ts` — imports from `expo-secure-store`, used on iOS/Android
- `secureStorage.ts` — uses `sessionStorage` as web fallback

Then import from `@/src/utils/secureStorage` (no platform suffix). Metro automatically picks the right file.

The same pattern applies to any other native-only Expo package (camera, haptics, etc.) if they need to be imported by files that also run on web.
