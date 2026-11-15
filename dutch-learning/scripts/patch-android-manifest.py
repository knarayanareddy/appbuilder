#!/usr/bin/env python3
"""Declare the text-to-speech intent in the manifest that `cap add android` generates.

Android 11+ filters which other apps a package may see. `TextToSpeech` binds to the
device's speech engine through the implicit intent `android.intent.action.TTS_SERVICE`,
and without a matching `<queries>` entry that lookup is filtered out — so the engine
looks absent, every `speak()` call fails, and the app falls back to silence. It is the
one Android-only failure that would make the whole product look broken.

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
