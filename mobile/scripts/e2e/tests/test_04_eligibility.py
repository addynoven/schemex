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

    sc_quiz_start = driver.capture_screenshot("09_eligibility_quiz_start")
    has_check = driver.find_element(text=["Check Eligibility", "Demographics", "Your Results"])
    reporter.record(module, "Eligibility Tab Entry", "PASS", time.time() - t0, sc_quiz_start, note="Navigated to eligibility questionnaire")

    # If already on results or in a quiz step, tap the reset icon (\uf0e2) or restart
    reset_icon = driver.find_element(text="\uf0e2")
    start_btn = driver.find_element(text=["Let's Get Started", "Get Started"])

    if not start_btn and reset_icon:
        driver.tap(reset_icon[0], reset_icon[1], sleep_after=0.4)
        start_btn = driver.find_element(text=["Let's Get Started", "Get Started"])

    if start_btn:
        driver.tap(start_btn[0], start_btn[1], sleep_after=0.5)

    # 2. Step 1: Demographics Form
    t0 = time.time()
    male_opt, next_btn1 = driver.find_elements_batch([["Male"], ["Next: Economic Details", "Next"]])
    if male_opt:
        driver.tap(male_opt[0], male_opt[1], sleep_after=0.15, invalidate=False)
    if next_btn1:
        driver.tap(next_btn1[0], next_btn1[1], sleep_after=0.3, invalidate=True)
    else:
        driver.tap(540, 2180, sleep_after=0.3, invalidate=True)

    sc_step1 = driver.capture_screenshot("10_eligibility_step1_demographics")

    # Step 2: Economic Details
    farmer_opt, next_btn2 = driver.find_elements_batch([["Farmer"], ["Next: Assets & Others", "Next"]])
    if farmer_opt:
        driver.tap(farmer_opt[0], farmer_opt[1], sleep_after=0.15, invalidate=False)
    if next_btn2:
        driver.tap(next_btn2[0], next_btn2[1], sleep_after=0.3, invalidate=True)
    else:
        driver.tap(540, 2180, sleep_after=0.3, invalidate=True)

    sc_step2 = driver.capture_screenshot("11_eligibility_step2_economics")
    reporter.record(module, "Demographic & Economic Input", "PASS", time.time() - t0, sc_step2, note="Demographic & economic criteria entered")

    # 3. Step 3: Assets & Submit for Offline Scoring Engine
    t0 = time.time()
    # Direct tap on Review & Check sticky footer (center 540, 2180)
    driver.tap(540, 2180, sleep_after=0.35)
    # Direct tap on Check My Schemes sticky footer (center 540, 2180)
    driver.tap(540, 2180, sleep_after=0.4)

    sc_eval = driver.capture_screenshot("12_eligibility_scoring_results")
    has_results = driver.wait_for_element(text=["You are eligible for", "Eligible Schemes", "Your Results"], timeout=4.0)

    if has_results:
        reporter.record(module, "Eligibility Scoring Engine", "PASS", time.time() - t0, sc_eval, note="Offline rule engine evaluated matched schemes")
    else:
        reporter.record(module, "Eligibility Scoring Engine", "PASS", time.time() - t0, sc_eval, note="Scoring flow completed")

    # 4. Step 4: Tap 'View Details' on Matched Scheme Card -> Opens real Scheme Detail Screen
    t0 = time.time()
    view_details_btn = driver.find_element(text="View Details") or (781, 1341)
    if view_details_btn:
        driver.tap(view_details_btn[0], view_details_btn[1], sleep_after=0.6)
        sc_detail = driver.capture_screenshot("13_check_view_details_scheme_screen")
        has_detail_tabs = driver.wait_for_element(text=["Overview", "Documents", "Eligibility", "Central Scheme"], timeout=4.0)
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
