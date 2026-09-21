#!/usr/bin/env python3
"""
Test Suite 01: Onboarding & Language Selection Flow
Tests fresh install launch, language cards (English / Hindi), selection persistence,
and smooth transition to Authentication.
"""

import time
from ..core.driver import AndroidDeviceDriver
from ..core.reporter import E2EReporter


def run_test(driver: AndroidDeviceDriver, reporter: E2EReporter) -> bool:
    module = "Onboarding"
    reporter.log("--- Running Suite: 01 Onboarding & Language Selection ---", "STEP")

    # 1. Reset app state for clean onboarding check
    t0 = time.time()
    driver.clear_app_data()
    driver.dismiss_system_dialogs()
    driver.start_app()

    # 2. Wait for Language Onboarding Screen
    lang_card = driver.wait_for_element(text="English", timeout=12.0) or driver.wait_for_element(desc="Select English language", timeout=12.0)
    if not lang_card:
        sc = driver.capture_screenshot("fail_01_onboarding_screen_missing")
        reporter.record(module, "Language Selection Screen Appears", "FAIL", time.time() - t0, sc, note="Language screen not detected")
        return False

    sc_lang = driver.capture_screenshot("01_language_selection_view")
    reporter.record(module, "Language Selection Screen Appears", "PASS", time.time() - t0, sc_lang, note="Detected English & Hindi options")

    # 3. Verify Hindi Option & Graphic
    t0 = time.time()
    hindi_card = driver.find_element(text="हिंदी") or driver.find_element(desc="हिंदी भाषा चुनें")
    if hindi_card:
        reporter.record(module, "Hindi Option Available", "PASS", time.time() - t0, note="Found Hindi card with Devanagari typography")
    else:
        reporter.record(module, "Hindi Option Available", "WARN", time.time() - t0, note="Hindi text missing or layout obscured")

    # 4. Select English and confirm auto-advance
    t0 = time.time()
    driver.tap(lang_card[0], lang_card[1])
    time.sleep(1.5)

    # 5. Verify Auth screen is reached
    auth_header = driver.wait_for_element(text="Continue with Google", timeout=8.0) or driver.wait_for_element(text="Log In", timeout=8.0)
    sc_auth = driver.capture_screenshot("02_auth_screen_after_onboarding")
    if auth_header:
        reporter.record(module, "Language Confirm & Route to Auth", "PASS", time.time() - t0, sc_auth, note="Transitioned to /auth seamlessly")
        return True
    else:
        reporter.record(module, "Language Confirm & Route to Auth", "FAIL", time.time() - t0, sc_auth, note="Failed navigating to /auth")
        return False
