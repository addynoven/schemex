#!/usr/bin/env python3
"""
E2E Test Fixtures and Configurations
"""

from pathlib import Path

# Base Paths
E2E_DIR = Path(__file__).resolve().parent.parent
MOBILE_DIR = E2E_DIR.parent.parent
PROJECT_ROOT = MOBILE_DIR.parent
REPORTS_DIR = MOBILE_DIR / "e2e-reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"
APK_PATH = MOBILE_DIR / "SchemeApp-release.apk"

# Android Package & Activity Constants
PACKAGE_NAME = "com.schememobile.app"
MAIN_ACTIVITY = f"{PACKAGE_NAME}/.MainActivity"
DEFAULT_AVD = "Pixel_9"

# Test User Credentials
TEST_USER = {
    "email": "demo@schememobile.app",
    "password": "Password123!",
    "full_name": "Demo Citizen",
    "phone": "+919876543210",
    "state": "Goa",
    "district": "North Goa",
}

# Android Keycodes
KEYCODE_BACK = 4
KEYCODE_HOME = 3
KEYCODE_ESCAPE = 111
KEYCODE_ENTER = 66
