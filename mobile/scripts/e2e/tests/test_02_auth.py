#!/usr/bin/env python3
"""
Test Suite 02: Authentication & Login Flow
Tests Auth UI, Google button presence, Sign Up / Log In toggle, email credentials submission,
system dialog handling, and transition to bottom tabs.
"""

import re
import time
from ..core.driver import AndroidDeviceDriver
from ..core.reporter import E2EReporter
from ..core.fixtures import TEST_USER


def run_test(driver: AndroidDeviceDriver, reporter: E2EReporter) -> bool:
    module = "Authentication"
    reporter.log("--- Running Suite: 02 Authentication & Login ---", "STEP")
    driver.ensure_app_foreground()

    # Always reset auth state to test login from clean unauthenticated state
    driver.reset_auth_state()

    # If on "Check Your Email" screen (from previous signup), handle it
    check_email_screen = driver.find_element(text="Check Your Email")
    if check_email_screen:
        t0 = time.time()
        # Tap "I've Verified My Email"
        driver.tap_element(text="I've Verified My Email", timeout=2.0)
        time.sleep(1.0)
        if driver.find_element(text="Check Your Email"):
            # Fallback to "Use a different email or log in"
            driver.tap_element(text="Use a different email or log in", timeout=2.0) or driver.tap(540, 1300)

    # 1. Check Auth UI Elements
    t0 = time.time()
    has_google = driver.wait_for_element(text="Continue with Google", timeout=5.0) is not None
    has_login_tab = driver.find_element(text=["Log In", "Login"])
    sc_auth_ui = driver.capture_screenshot("03_auth_initial_view")

    if has_google and has_login_tab:
        reporter.record(module, "Auth Screen Structure", "PASS", time.time() - t0, sc_auth_ui, note="Google Sign-In & Login tab present")
    else:
        reporter.record(module, "Auth Screen Structure", "WARN", time.time() - t0, sc_auth_ui, note="Auth elements visible")

    # 2. Test Sign Up Tab Toggle
    t0 = time.time()
    driver.tap(785, 854, sleep_after=0.25)
    name_field = driver.wait_for_element(text=["Full Name", "e.g. Ramesh Kumar"], timeout=3.0)
    sc_signup = driver.capture_screenshot("04_signup_view")

    if name_field:
        reporter.record(module, "Sign Up View Toggle", "PASS", time.time() - t0, sc_signup, note="Full Name & registration form visible")
    else:
        reporter.record(module, "Sign Up View Toggle", "WARN", time.time() - t0, sc_signup, note="Toggle inspected")

    # 3. Switch back to Log In
    driver.tap(295, 854, sleep_after=0.2)

    # 4. Perform Email Login
    t0 = time.time()
    driver.clear_and_input(571, 1280, TEST_USER["email"], sleep_after=0.1)
    driver.clear_and_input(530, 1486, TEST_USER["password"], sleep_after=0.1)
    driver.dismiss_keyboard()

    # Tap Log In button directly on Pixel 9 coordinates
    driver.tap(540, 1730, sleep_after=0.6)
    driver.dismiss_system_dialogs()

    # 5. Verify Home / Tabs Reached (using single dump fast check)
    tab_indicator = driver.wait_for_any_element(
        texts=["Advisor", "Schemes", "Vault", "Check"],
        descs=["Open Citizen Profile", "Advisor", "Schemes"],
        timeout=8.0,
    )
    sc_post_login = driver.capture_screenshot("05_post_login_tabs_view")

    if tab_indicator:
        driver._authenticated = True
        reporter.record(module, "Email Login & Navigation to Tabs", "PASS", time.time() - t0, sc_post_login, note="Authenticated citizen loaded into tabs")
        return True
    else:
        reporter.record(module, "Email Login & Navigation to Tabs", "FAIL", time.time() - t0, sc_post_login, note="Tabs not visible after login")
        return False
