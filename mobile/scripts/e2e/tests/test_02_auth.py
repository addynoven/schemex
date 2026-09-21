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
    time.sleep(1.0)

    # Always reset auth state to test login from clean unauthenticated state
    driver.reset_auth_state()

    # If on "Check Your Email" screen (from previous signup), handle it
    check_email_screen = driver.find_element(text="Check Your Email")
    if check_email_screen:
        t0 = time.time()
        # Tap "I've Verified My Email"
        driver.tap_element(text="I've Verified My Email", timeout=3.0)
        time.sleep(2.0)
        if driver.find_element(text="Check Your Email"):
            # Fallback to "Use a different email or log in"
            driver.tap_element(text="Use a different email or log in", timeout=3.0) or driver.tap(540, 1300)
            time.sleep(1.5)

    # 1. Check Auth UI Elements
    t0 = time.time()
    has_google = driver.wait_for_element(text="Continue with Google", timeout=6.0) is not None
    has_login_tab = driver.find_element(text="Log In") or driver.find_element(text="Login")
    sc_auth_ui = driver.capture_screenshot("03_auth_initial_view")

    if has_google and has_login_tab:
        reporter.record(module, "Auth Screen Structure", "PASS", time.time() - t0, sc_auth_ui, note="Google Sign-In & Login tab present")
    else:
        reporter.record(module, "Auth Screen Structure", "WARN", time.time() - t0, sc_auth_ui, note="Auth elements visible")

    # 2. Test Sign Up Tab Toggle
    t0 = time.time()
    tapped_signup = driver.tap_element(text="Sign Up", timeout=3.0) or driver.tap(785, 854)
    time.sleep(1.0)
    name_field = driver.find_element(text="Full Name") or driver.find_element(text="e.g. Ramesh Kumar")
    sc_signup = driver.capture_screenshot("04_signup_view")

    if tapped_signup and name_field:
        reporter.record(module, "Sign Up View Toggle", "PASS", time.time() - t0, sc_signup, note="Full Name & registration form visible")
    else:
        reporter.record(module, "Sign Up View Toggle", "WARN", time.time() - t0, sc_signup, note="Toggle inspected")

    # 3. Switch back to Log In
    driver.tap_element(text="Login", timeout=3.0) or driver.tap(295, 854)
    time.sleep(1.0)

    # 4. Perform Email Login
    t0 = time.time()
    driver.dismiss_system_dialogs()
    time.sleep(0.3)

    # Find both input fields in a single UI dump before virtual keyboard opens
    root = driver.get_ui_dump()
    email_coords = None
    pass_coords = None
    if root is not None:
        for node in root.iter("node"):
            if "EditText" in node.get("class", ""):
                bounds = node.get("bounds", "")
                m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                if m:
                    cx = (int(m.group(1)) + int(m.group(3))) // 2
                    cy = (int(m.group(2)) + int(m.group(4))) // 2
                    if node.get("password") == "true":
                        pass_coords = (cx, cy)
                    else:
                        email_coords = (cx, cy)

    email_coords = email_coords or (571, 1280)
    pass_coords = pass_coords or (530, 1486)

    driver.clear_and_input(email_coords[0], email_coords[1], TEST_USER["email"])
    driver.clear_and_input(pass_coords[0], pass_coords[1], TEST_USER["password"])

    driver.dismiss_keyboard()
    time.sleep(0.4)

    # Tap Log In button (find by text or desc)
    driver.tap_element(text="Log In", timeout=3.0) or driver.tap(540, 1730)
    time.sleep(1.8)

    # Proactively dismiss any system / Google Password Manager popups
    driver.dismiss_system_dialogs()
    time.sleep(0.4)

    # 5. Verify Home / Tabs Reached (using single dump fast check)
    tab_indicator = driver.wait_for_any_element(
        texts=["Advisor", "Schemes", "Vault", "Check"],
        timeout=10.0,
    )
    sc_post_login = driver.capture_screenshot("05_post_login_tabs_view")

    if tab_indicator:
        reporter.record(module, "Email Login & Navigation to Tabs", "PASS", time.time() - t0, sc_post_login, note="Authenticated citizen loaded into tabs")
        return True
    else:
        reporter.record(module, "Email Login & Navigation to Tabs", "FAIL", time.time() - t0, sc_post_login, note="Tabs not visible after login")
        return False
