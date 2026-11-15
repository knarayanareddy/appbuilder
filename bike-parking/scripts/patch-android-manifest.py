#!/usr/bin/env python3
"""Declare the camera intent in the Android manifest that `cap add android` generates.

Capacitor turns a `<input type="file" capture>` into `MediaStore.ACTION_IMAGE_CAPTURE`,
but before launching it asks the system whether anything can handle that intent
(`Intent.resolveActivity`). Android 11+ filters that question unless the app declares
the intent, so without this block the lookup comes back empty, Capacitor quietly falls
back to the file picker, and the "Take photo" button opens the gallery instead.

Usage: python3 scripts/patch-android-manifest.py [path/to/AndroidManifest.xml]
"""

from __future__ import annotations

import sys
import xml.etree.ElementTree as ElementTree
from pathlib import Path

ACTION = "android.media.action.IMAGE_CAPTURE"

BLOCK = """<!-- Android 11+ hides other apps unless their intents are declared. Capacitor
         asks whether a camera app can handle ACTION_IMAGE_CAPTURE before launching
         it; without this, that lookup is filtered and "Take photo" silently opens
         the photo picker instead of the camera. -->
    <queries>
        <intent>
            <action android:name="android.media.action.IMAGE_CAPTURE" />
        </intent>
    </queries>

"""

DEFAULT_MANIFEST = Path(__file__).resolve().parent.parent / "android/app/src/main/AndroidManifest.xml"


def patch(path: Path) -> bool:
    """Insert the <queries> block; returns False when it was already there."""
    text = path.read_text(encoding="utf-8")

    if ACTION in text:
        return False

    if "<application" not in text:
        raise SystemExit(f"{path}: no <application> element to anchor against")

    patched = text.replace("<application", BLOCK + "    <application", 1)

    # Never write a manifest Gradle cannot read.
    ElementTree.fromstring(patched)

    path.write_text(patched, encoding="utf-8")
    return True


def main(argv: list[str]) -> int:
    path = Path(argv[1]) if len(argv) > 1 else DEFAULT_MANIFEST

    if not path.exists():
        raise SystemExit(f"{path}: not found — run `npx cap add android` first")

    if patch(path):
        print(f"declared {ACTION} in {path}")
    else:
        print(f"{ACTION} already declared in {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
