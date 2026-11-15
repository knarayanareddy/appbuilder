# Signing key

`taal.p12` is the **pinned release key** for the Taal APK. Every CI build is signed
with it, so each new APK installs over the previous one and your cards, schedule and
history survive the update.

| | |
| --- | --- |
| File | `keystore/taal.p12` (PKCS#12) |
| Alias | `taal` |
| Store password | `taal-dev-key` |
| Key password | `taal-dev-key` |
| Algorithm | RSA 3072, SHA384withRSA |
| Valid until | 2056-12-27 |
| Certificate SHA-256 | `99f6015443917ed3f0ad5f5ebb747d12fdcdfee927804a27e31e6b4e63cf7449` |

## Why this file is in the repository

A debug APK signed by a *different* key on each build cannot be installed over the
last one: Android refuses with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, and the only way
forward is to uninstall — which deletes the app's database. Pinning one key is the
entire fix. It is public on purpose: this is a personal sideloaded app, not a Play
Store release, and the password is in the repo so CI needs no secrets.

## Consequences

- **Keep this file.** If it is lost, the next APK needs an uninstall, and an uninstall
  wipes progress. Back up from the app's Settings before switching keys.
- Play Store uploads would require a real, private key — out of scope.
- Verify any build yourself:

  ```bash
  apksigner verify --print-certs app-debug.apk | grep 'SHA-256'
  ```

  The digest must equal the certificate fingerprint above.
