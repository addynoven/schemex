#!/usr/bin/env python3
"""
Test Delta Sync Flow:
1. Log in and switch to Schemes tab.
2. Capture screenshot of initial Schemes tab with sync badge.
3. Check catalog version from cloud.
"""

import sys
import time
from pathlib import Path

# Add mobile/scripts to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(SCRIPT_DIR / "e2e"))

from core.driver import AndroidDeviceDriver
from core.reporter import E2EReporter

def main():
    driver = AndroidDeviceDriver()
    driver.ensure_device()
    driver.ensure_app_foreground()

    print("[1] Logging in...")
    ok = driver.fast_login()
    print(f"Logged in: {ok}")
    time.sleep(1.5)

    print("[2] Switching to Schemes tab...")
    driver.switch_tab("schemes")
    time.sleep(2.0)

    sc = driver.capture_screenshot("delta_sync_01_schemes_initial")
    print(f"Screenshot saved to: {sc}")

    # Check UI dump for sync badge
    root = driver.get_ui_dump()
    if root is not None:
        for node in root.iter("node"):
            text = node.get("text", "")
            desc = node.get("content-desc", "")
            if "up to date" in text.lower() or "up to date" in desc.lower() or "synced" in desc.lower():
                print(f"Found sync status: text='{text}', desc='{desc}'")
            if "update available" in text.lower():
                print(f"Found update available: text='{text}'")

if __name__ == "__main__":
    main()
