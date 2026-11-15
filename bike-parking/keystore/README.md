# The signing key

`bike-lot.p12` is the key every build is signed with. It is committed on purpose, and this
file explains why and what it does not protect.

| | |
|---|---|
| File | `bike-lot.p12` (PKCS12, one entry) |
| Alias | `bikelot` |
| Store/key password | `bikelot-dev-key` |
| Key | RSA 3072, SHA256withRSA |
| Certificate | self-signed, `CN=Bike Lot signing key` |
| Valid until | 2056-11-07 |
| Certificate SHA-256 | `266274de1da8df31dc9d4916eb2698d670caf8865104593b5247c0a3fdff44c1` |

## Why it exists

Android will only install a new APK on top of an existing one when **both are signed with the
same key**. Otherwise the installer refuses, and the only way forward is to uninstall — which
deletes the app's data directory, and with it every bike, item and photo.

Builds used to take whatever debug keystore the CI runner generated, and each runner makes a
fresh one. Three consecutive runs produced three different certificates:

```
06a69a9f…5e0a63     19405f29…5d7cbb     b012280b…391202
```

So every update would have required an uninstall, silently turning "upgrade the app" into
"lose the inventory". Pinning one key fixes that permanently: the certificate above is now the
same for every build, forever, so updates install over the top and the database survives.

CI does the signing with `zipalign` + `apksigner` from Android build-tools after Gradle has
produced the unsigned-by-its-own-key APK, and fails the build if `apksigner verify` does not
pass.

## What it is not

- **Not a secret worth protecting like a release key.** It lives in a public repository, so
  anyone could sign an APK that Android would accept as an update to this app. That only
  matters for a sideloaded personal app: nobody can push anything to your phone without you
  installing a file. Do not treat this key as evidence of provenance.
- **Not for Google Play.** A Play release needs a private key held outside the repo
  (keystore + passwords in secrets, or Play App Signing). If this app ever goes to Play, mint a
  new key and expect the Play build to be a separate install identity.
- **Not encryption.** The data in the app is not encrypted by the signature; it only proves
  which key produced the file.

## Removing it

Delete this folder and the "Sign with the pinned key" step. Every future build then gets a
random key again, and every upgrade needs an uninstall — which is what the pinned key was
added to prevent.
