# Putting the APK in Google Drive automatically

**This is the optional, fiddly route. Do you need it?**

- **To install on the phone: no.** Open
  `https://github.com/knarayanareddy/appbuilder/releases/download/bike-lot-latest/app-debug.apk`
  on the phone, tap the download, install. Nothing to set up.
- **To keep an archive copy: barely.** On the Mac, open that same link (it downloads
  `app-debug.apk`), then drag the file into your Drive folder. Two actions, only when you want
  one.

Set this up only if you want every build to land in Drive without touching anything.

---

## Why there is no one-command shortcut

The usual shortcut is `rclone authorize "drive"`, which borrows rclone's shared Google client
and needs no project of your own. It is not recommended here: that shared client is rate
limited and rclone announced during 2026 that Google intends to retire it. A token minted
against it can stop working without warning, and then the build fails for a reason that has
nothing to do with this app.

The other shortcut people suggest — a **service account** — cannot work on a personal Gmail
account at all: service accounts have zero storage quota, so a file they own cannot be
written.

So the credential has to be one you mint yourself, once. Roughly ten minutes.

## The console moved: what you will actually see

Older guides (and earlier drafts of this file) say *"APIs & Services → OAuth consent screen"*.
Since the 2024/2026 redesign that menu item no longer exists. You will find **Google Auth
Platform**, with four tabs: **Branding**, **Audience**, **Data Access**, **Clients**. Follow
the order below, which matches the screen.

### 1. Project and API

1. [console.cloud.google.com](https://console.cloud.google.com) → project picker → **New
   project** (any name).
2. Search "Google Drive API" in the top bar → **Enable**.

### 2. Branding (this is what used to be the consent screen)

3. Menu → **APIs & Services → Google Auth Platform**. If it says *not configured yet*, click
   **Get started**.
4. **App information**: app name (e.g. `Bike Lot upload`) and your email → Next.
5. **Audience**: **External** → Next. (Internal only exists for Workspace organisations.)
6. **Contact information**: your email → Next → agree → **Create**.
7. On the Google Auth Platform dashboard open **Audience**. Under *Testing* your refresh token
   dies after 7 days. Click **Publish app** → confirm (*In production*). Google will show an
   "unverified app" warning to you later — expected, it is your own project, click through
   *Advanced → Go to …*.

### 3. Client

8. Google Auth Platform → **Clients** → **Create client**.
9. Application type: **Web application**. (Not *Android*: this credential belongs to the build
   machine, which has no package name and no signing certificate. Not *Desktop*: the Playground
   in step 12 only accepts web clients. Android clients also have no client secret, and a
   refresh token cannot be renewed server-side without one.)
10. Under **Authorised redirect URIs** add exactly
    `https://developers.google.com/oauthplayground` → **Create**.
11. Copy the **Client ID** and **Client secret**.

### 4. Refresh token

12. Open the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground) → gear icon
    → tick **Use your own OAuth credentials** → paste the id and secret → close.
13. Left panel, *Step 1*: in **Input your own scopes** type
    `https://www.googleapis.com/auth/drive` → **Authorize APIs** → sign in → allow.
14. *Step 2*: **Exchange authorization code for tokens** → copy the **refresh token**.

    (`drive` is needed rather than `drive.file` because a hand-made folder is invisible to the
    narrower scope, so the build could not upload into it.)

### 5. Folder and secrets

15. In Drive, create the folder, e.g. `Bike Lot`. Its id is the part of its URL after
    `/folders/`.
16. GitHub → this repository → **Settings → Secrets and variables → Actions**:
    - *Secrets*: `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET`, `GDRIVE_REFRESH_TOKEN`
    - *Variables*: `GDRIVE_FOLDER_ID`

### 6. Confirm

```
node scripts/upload-to-drive.mjs --check
```

says whether the configuration is present. The next build replaces
`bike-lot-app-debug.apk` in that folder (same file id each time, so links stay valid) and
prints `https://drive.google.com/file/d/<id>/view`. Until the secrets exist, the CI step is
simply **skipped** and the build is unaffected.

## Undoing it

Delete the three secrets. The step goes back to skipped on the next build. To revoke the
access itself: [myaccount.google.com/permissions](https://myaccount.google.com/permissions) →
remove the app.
