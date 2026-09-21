#!/usr/bin/env python3
"""
Master E2E Test Suite Orchestrator
Scheme Mobile App Automated Quality Engineering System
"""

import sys
import os
import argparse
from pathlib import Path

# Add scripts directory to path for imports
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR.parent))

from e2e.core.driver import AndroidDeviceDriver
from e2e.core.reporter import E2EReporter, BOLD, CYAN, GREEN, RED, RESET
from e2e.tests import (
    test_01_onboarding,
    test_02_auth,
    test_03_schemes,
    test_04_eligibility,
    test_05_vault,
    test_06_advisor,
    test_07_profile,
)
import time


def run_fast_login_test(driver: AndroidDeviceDriver, reporter: E2EReporter) -> bool:
    module = "Fast Authentication"
    reporter.log("--- Establishing Fast Authenticated Session ---", "STEP")
    t0 = time.time()
    ok = driver.fast_login()
    sc = driver.capture_screenshot("00_fast_login_state")
    if ok:
        reporter.record(module, "Fast Login State", "PASS", time.time() - t0, sc, note="App authenticated and ready in tabs")
        return True
    else:
        reporter.record(module, "Fast Login State", "FAIL", time.time() - t0, sc, note="Failed to authenticate")
        return False


def run_google_login_test(driver: AndroidDeviceDriver, reporter: E2EReporter) -> bool:
    module = "Google Authentication"
    reporter.log("--- Testing Google One-Tap Sign-In ---", "STEP")
    t0 = time.time()
    driver.ensure_app_foreground()
    if driver.is_logged_in():
        driver.reset_auth_state()
    ok = driver.google_sign_in(timeout=14.0)
    sc = driver.capture_screenshot("00_google_signin_success")
    if ok:
        reporter.record(module, "Google Sign-In", "PASS", time.time() - t0, sc, note="Authenticated via Google account into tabs")
        return True
    else:
        reporter.record(module, "Google Sign-In", "FAIL", time.time() - t0, sc, note="Google Sign-In did not reach tabs")
        return False


SUITES = {
    "login": ("Fast Authentication & Setup", run_fast_login_test),
    "google": ("Google Sign-In Flow", run_google_login_test),
    "onboarding": ("01 Onboarding Flow", test_01_onboarding.run_test),
    "auth": ("02 Authentication & Login", test_02_auth.run_test),
    "schemes": ("03 Schemes Offline Search", test_03_schemes.run_test),
    "eligibility": ("04 Eligibility Quiz & Engine", test_04_eligibility.run_test),
    "vault": ("05 Document Vault", test_05_vault.run_test),
    "advisor": ("06 AI Scheme Advisor", test_06_advisor.run_test),
    "profile": ("07 Profile, Settings & Logout", test_07_profile.run_test),
}

# The default regression order (excluding standalone utilities 'login' and 'google')
REGRESSION_SUITES = [k for k in SUITES.keys() if k not in ("login", "google")]


def main():
    parser = argparse.ArgumentParser(description="Automated E2E Test Runner for Scheme Mobile App")
    parser.add_argument("--all", action="store_true", help="Run the entire regression test suite")
    parser.add_argument("--login", action="store_true", help="Quickly log into the app and leave it authenticated in tabs")
    parser.add_argument(
        "--test",
        choices=list(SUITES.keys()),
        help=f"Run a specific test module: {', '.join(SUITES.keys())}",
    )
    parser.add_argument("--install", action="store_true", help="Reinstall the latest compiled release APK before running tests")
    parser.add_argument("--avd", default="Pixel_9", help="Android Virtual Device name")
    args = parser.parse_args()

    # Default to --all if no specific suite selected
    run_all = args.all or (not args.test and not args.login)

    print(f"\n{BOLD}{CYAN}==================================================================={RESET}")
    print(f"{BOLD}{CYAN}      Scheme Mobile App — Automated Modular E2E Test Suite        {RESET}")
    print(f"{BOLD}{CYAN}==================================================================={RESET}\n")

    reporter = E2EReporter()
    driver = AndroidDeviceDriver(avd_name=args.avd)

    # 1. Device Readiness Check
    reporter.log("Checking Android emulator / device connection...", "INFO")
    try:
        device_id = driver.ensure_device()
        reporter.log(f"Active device ready: {device_id}", "PASS")
    except Exception as e:
        reporter.log(f"Failed connecting to Android device: {e}", "FAIL")
        sys.exit(1)

    # Quick --login standalone execution
    if args.login:
        reporter.log("Executing Fast Login...", "INFO")
        success = driver.fast_login()
        if success:
            reporter.log("App successfully authenticated and ready in tabs!", "PASS")
            sys.exit(0)
        else:
            reporter.log("Failed to complete fast login.", "FAIL")
            sys.exit(1)

    # Reinstall APK if requested
    if args.install:
        reporter.log("Installing latest SchemeApp-release.apk onto device...", "INFO")
        try:
            driver.install_app()
            reporter.log("APK installed successfully", "PASS")
        except Exception as e:
            reporter.log(f"Failed installing APK: {e}", "FAIL")
            sys.exit(1)

    # 2. Select suites to run
    if run_all:
        suites_to_run = [(k, SUITES[k]) for k in REGRESSION_SUITES]
    else:
        suites_to_run = [(args.test, SUITES[args.test])]

    # 3. Execute Suites
    total_passed = 0
    total_failed = 0

    for key, (label, test_func) in suites_to_run:
        try:
            ok = test_func(driver, reporter)
            if ok:
                total_passed += 1
            else:
                total_failed += 1
        except Exception as e:
            reporter.log(f"Unhandled exception in {label}: {e}", "FAIL")
            fail_sc = driver.capture_screenshot(f"exception_{key}")
            driver.capture_logcat(f"exception_{key}")
            reporter.record(label, "Execution Safety", "FAIL", 0.0, fail_sc, note=str(e))
            total_failed += 1

    # 4. Generate Reports
    md_path = reporter.generate_markdown()
    html_path = reporter.generate_html()

    print(f"\n{BOLD}-------------------------------------------------------------------{RESET}")
    print(f"{BOLD}Summary: {GREEN}{total_passed} Passed{RESET} | {RED if total_failed > 0 else GREEN}{total_failed} Failed{RESET}")
    print(f"Markdown Report: {md_path}")
    print(f"HTML Report:     {html_path}")
    print(f"{BOLD}-------------------------------------------------------------------{RESET}\n")

    sys.exit(0 if total_failed == 0 else 1)


if __name__ == "__main__":
    main()
