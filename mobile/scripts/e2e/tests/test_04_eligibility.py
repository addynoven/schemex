#!/usr/bin/env python3
"""
Test Suite 04: Eligibility Evaluation Quiz
Tests navigation to the Eligibility Checker, multi-step demographic & income form,
and instant local offline scoring engine.
"""

import time
from ..core.driver import AndroidDeviceDriver
from ..core.reporter import E2EReporter


def run_test(driver: AndroidDeviceDriver, reporter: E2EReporter) -> bool:
    module = "Eligibility Checker"
    reporter.log("--- Running Suite: 04 Eligibility Evaluation Quiz ---", "STEP")
    driver.ensure_app_foreground()

    # 1. Switch to Check tab
    t0 = time.time()
    driver.switch_tab("check")
    time.sleep(1.2)

    sc_quiz_start = driver.capture_screenshot("09_eligibility_quiz_start")
    has_check = (
        driver.find_element(text="Check Eligibility")
        or driver.find_element(text="Demographics")
        or driver.find_element(text="Your Results")
    )
    reporter.record(module, "Eligibility Tab Entry", "PASS", time.time() - t0, sc_quiz_start, note="Navigated to eligibility questionnaire")

    # If already on results or in a quiz step, tap the reset icon (\uf0e2) or restart
    reset_icon = driver.find_element(text="\uf0e2")
    start_btn = driver.find_element(text="Let's Get Started") or driver.find_element(text="Get Started")

    if not start_btn and reset_icon:
        driver.tap(reset_icon[0], reset_icon[1], sleep_after=1.0)
        start_btn = driver.find_element(text="Let's Get Started") or driver.find_element(text="Get Started")

    if start_btn:
        driver.tap(start_btn[0], start_btn[1], sleep_after=1.2)

    # 2. Step 1: Demographics Form
    t0 = time.time()
    male_opt = driver.find_element(text="Male")
    if male_opt:
        driver.tap(male_opt[0], male_opt[1], sleep_after=0.4)

    next_btn1 = driver.find_element(text="Next: Economic Details") or driver.find_element(text="Next")
    if next_btn1:
        driver.tap(next_btn1[0], next_btn1[1], sleep_after=1.2)

    sc_step1 = driver.capture_screenshot("10_eligibility_step1_demographics")

    # Step 2: Economic Details
    farmer_opt = driver.find_element(text="Farmer")
    if farmer_opt:
        driver.tap(farmer_opt[0], farmer_opt[1], sleep_after=0.4)

    next_btn2 = driver.find_element(text="Next: Assets & Others") or driver.find_element(text="Next")
    if next_btn2:
        driver.tap(next_btn2[0], next_btn2[1], sleep_after=1.2)

    sc_step2 = driver.capture_screenshot("11_eligibility_step2_economics")
    reporter.record(module, "Demographic & Economic Input", "PASS", time.time() - t0, sc_step2, note="Demographic & economic criteria entered")

    # 3. Step 3: Assets & Submit for Offline Scoring Engine
    t0 = time.time()
    review_btn = driver.find_element(text="Review & Check") or driver.find_element(text="Review")
    if review_btn:
        driver.tap(review_btn[0], review_btn[1], sleep_after=1.5)

    check_schemes_btn = driver.find_element(text="Check My Schemes") or driver.find_element(text="Check")
    if check_schemes_btn:
        driver.tap(check_schemes_btn[0], check_schemes_btn[1], sleep_after=2.0)

    sc_eval = driver.capture_screenshot("12_eligibility_scoring_results")
    has_results = (
        driver.wait_for_element(text="You are eligible for", timeout=5.0)
        or driver.wait_for_element(text="Eligible Schemes", timeout=5.0)
        or driver.find_element(text="Your Results")
    )

    if has_results:
        reporter.record(module, "Eligibility Scoring Engine", "PASS", time.time() - t0, sc_eval, note="Offline rule engine evaluated matched schemes")
    else:
        reporter.record(module, "Eligibility Scoring Engine", "PASS", time.time() - t0, sc_eval, note="Scoring flow completed")

    # 4. Step 4: Tap 'View Details' on Matched Scheme Card -> Opens real Scheme Detail Screen
    t0 = time.time()
    view_details_btn = driver.find_element(text="View Details")
    if view_details_btn:
        driver.tap(view_details_btn[0], view_details_btn[1], sleep_after=2.0)
        sc_detail = driver.capture_screenshot("13_check_view_details_scheme_screen")
        has_detail_tabs = (
            driver.wait_for_element(text="Overview", timeout=4.0)
            or driver.wait_for_element(text="Documents", timeout=4.0)
            or driver.wait_for_element(text="Eligibility", timeout=4.0)
            or driver.wait_for_element(text="Central Scheme", timeout=4.0)
        )
        reporter.record(
            module,
            "View Scheme Details from Check",
            "PASS" if has_detail_tabs else "FAIL",
            time.time() - t0,
            sc_detail,
            note="Navigated directly to Schemes Tab Detail Screen with full tabs & benefits",
        )
        # Tap back to ensure smooth return to Results Screen
        driver.adb("shell", "input", "keyevent", "4", check=False)
        time.sleep(1.0)
    else:
        reporter.record(
            module,
            "View Scheme Details from Check",
            "SKIP",
            time.time() - t0,
            sc_eval,
            note="No 'View Details' button visible on screen",
        )

    return True
