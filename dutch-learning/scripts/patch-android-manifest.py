#!/usr/bin/env python3
"""Declare the text-to-speech intent plus the vibration and microphone permissions in the
manifest that `cap add android` generates.

Android 11+ filters which other apps a package may see. `TextToSpeech` binds to the
device's speech engine through the implicit intent `android.intent.action.TTS_SERVICE`,
and without a matching `<queries>` entry that lookup is filtered out — so the engine
looks absent, every `speak()` call fails, and the app falls back to silence. It is the
one Android-only failure that would make the whole product look broken.

Haptics need `android.permission.VIBRATE`: Capacitor's Haptics plugin and the WebView's
`navigator.vibrate` both go through the vibrator service, and without the permission the
call is dropped without an error.

The speech check needs `android.permission.RECORD_AUDIO`. It is a runtime permission, so
the plugin asks the first time a card is spoken and a refusal just hides the microphone.

Usage: python3 scripts/patch-android-manifest.py [path/to/AndroidManifest.xml]
"""

from __future__ import annotations

import sys
import xml.etree.ElementTree as ElementTree
from pathlib import Path

ACTION = "android.intent.action.TTS_SERVICE"

BLOCK = """<!-- Android 11+ package visibility: binding to the on-device text-to-speech
         engine requires declaring TTS_SERVICE, or speak() silently finds nothing. -->
    <queries>
        <intent>
            <action android:name="android.intent.action.TTS_SERVICE" />
        </intent>
    </queries>

"""

PERMISSIONS = (
    "android.permission.VIBRATE",
    "android.permission.RECORD_AUDIO",
)

DEFAULT_MANIFEST = Path(__file__).resolve().parent.parent / "android/app/src/main/AndroidManifest.xml"


def patch(path: Path) -> bool:
    """Insert what is missing; returns False when the manifest was already correct."""
    text = path.read_text(encoding="utf-8")

    if "<application" not in text:
        raise SystemExit(f"{path}: no <application> element to anchor against")

    patched = text

    if ACTION not in patched:
        patched = patched.replace("<application", BLOCK + "    <application", 1)

    for permission in PERMISSIONS:
        if permission in patched:
            continue
        anchor = "<application"
        line = f'    <uses-permission android:name="{permission}" />\n\n'
        patched = patched.replace(anchor, line + "    " + anchor, 1)

    if patched == text:
        return False

    # Never write a manifest Gradle cannot read.
    ElementTree.fromstring(patched)

    path.write_text(patched, encoding="utf-8")
    return True


def main(argv: list[str]) -> int:
    path = Path(argv[1]) if len(argv) > 1 else DEFAULT_MANIFEST

    if not path.exists():
        raise SystemExit(f"{path}: not found — run `npx cap add android` first")

    if patch(path):
        print(f"patched {path}: {ACTION}, {', '.join(PERMISSIONS)}")
    else:
        print(f"{path}: nothing to declare, already patched")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
