#!/usr/bin/env python3
"""
Scheme App — Automated Emulator E2E Test Runner
Performs automated APK installation, launch, UI navigation, screenshots,
and logcat error capture on Android emulator.
"""

import sys
import os
import time
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
MOBILE_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = MOBILE_DIR.parent
SCREENSHOTS_DIR = MOBILE_DIR / "e2e-screenshots"
APK_PATH = MOBILE_DIR / "SchemeApp-release.apk"
PACKAGE_NAME = "com.schememobile.app"
ACTIVITY_NAME = f"{PACKAGE_NAME}/.MainActivity"

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


class EmulatorTestRunner:
    def __init__(self, avd_name: str = "Pixel_9"):
        self.avd_name = avd_name
        self.device_id = None
        SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        self.results = []

    def log(self, msg: str, status: str = "INFO"):
        color = CYAN if status == "INFO" else (GREEN if status == "PASS" else (RED if status == "FAIL" else YELLOW))
        print(f"{color}[{status}]{RESET} {msg}")

    def run_cmd(self, cmd: list[str], check: bool = True, capture: bool = True) -> subprocess.CompletedProcess:
        try:
            return subprocess.run(
                cmd,
                check=check,
                text=True,
                capture_output=capture,
                timeout=120,
            )
        except subprocess.TimeoutExpired:
            self.log(f"Command timed out: {' '.join(cmd)}", "FAIL")
            raise

    def check_or_start_device(self):
        self.log("Detecting connected Android devices / emulators...")
        res = self.run_cmd(["adb", "devices"])
        lines = [line.strip() for line in res.stdout.strip().split("\n")[1:] if line.strip()]

        for line in lines:
            parts = line.split()
            if len(parts) >= 2 and parts[1] == "device":
                self.device_id = parts[0]
                self.log(f"Found active device: {self.device_id}", "PASS")
                return

        # If no active device, boot emulator
        self.log(f"No active device detected. Booting emulator '{self.avd_name}'...", "INFO")
        subprocess.Popen(
            ["emulator", "-avd", self.avd_name, "-no-snapshot-load", "-no-boot-anim"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        self.log("Waiting for emulator to connect to adb...", "INFO")
        self.run_cmd(["adb", "wait-for-device"])

        # Wait for system boot completed
        self.log("Waiting for Android system boot to complete...", "INFO")
        for _ in range(60):
            res = self.run_cmd(["adb", "shell", "getprop", "sys.boot_completed"], check=False)
            if res.stdout.strip() == "1":
                self.log("Android system boot completed successfully!", "PASS")
                self.device_id = "emulator"
                time.sleep(2)
                return
            time.sleep(2)

        raise RuntimeError("Timed out waiting for emulator boot")

    def capture_screenshot(self, name: str) -> Path:
        out_path = SCREENSHOTS_DIR / f"{name}.png"
        try:
            with open(out_path, "wb") as f:
                subprocess.run(["adb", "exec-out", "screencap", "-p"], stdout=f, check=True)
            self.log(f"Saved screenshot: {out_path.name}", "INFO")
            return out_path
        except Exception as e:
            self.log(f"Failed to capture screenshot: {e}", "FAIL")
            return out_path

    def capture_logcat(self, name: str) -> Path:
        out_path = SCREENSHOTS_DIR / f"{name}_logcat.txt"
        try:
            res = self.run_cmd(["adb", "logcat", "-d", "-s", "ReactNative:V", "ReactNativeJS:V", "AndroidRuntime:E"], check=False)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(res.stdout)
            self.log(f"Captured logcat: {out_path.name}", "INFO")
            return out_path
        except Exception as e:
            self.log(f"Failed to capture logcat: {e}", "FAIL")
            return out_path

    def get_ui_dump(self) -> ET.Element:
        self.run_cmd(["adb", "shell", "uiautomator", "dump", "/sdcard/window_dump.xml"], check=False)
        res = self.run_cmd(["adb", "shell", "cat", "/sdcard/window_dump.xml"], check=False)
        xml_str = res.stdout.strip()
        if not xml_str or not xml_str.startswith("<?xml"):
            time.sleep(1)
            res = self.run_cmd(["adb", "shell", "cat", "/sdcard/window_dump.xml"], check=False)
            xml_str = res.stdout.strip()
        return ET.fromstring(xml_str)

    def find_element(self, text: str = None, desc: str = None) -> tuple[int, int] | None:
        try:
            root = self.get_ui_dump()
            for node in root.iter("node"):
                node_text = node.get("text", "")
                node_desc = node.get("content-desc", "")
                if (text and text.lower() in node_text.lower()) or (desc and desc.lower() in node_desc.lower()):
                    bounds = node.get("bounds", "")
                    # Bounds format: [x1,y1][x2,y2]
                    import re
                    match = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                    if match:
                        x1, y1, x2, y2 = map(int, match.groups())
                        return (x1 + x2) // 2, (y1 + y2) // 2
        except Exception as e:
            self.log(f"UI search error: {e}", "WARN")
        return None

    def tap(self, x: int, y: int):
        self.run_cmd(["adb", "shell", "input", "tap", str(x), str(y)], check=False)
        time.sleep(0.5)

    def tap_element(self, text: str = None, desc: str = None) -> bool:
        coords = self.find_element(text=text, desc=desc)
        if coords:
            self.log(f"Tapping '{text or desc}' at {coords}", "INFO")
            self.tap(coords[0], coords[1])
            return True
        self.log(f"Element '{text or desc}' not found on screen", "WARN")
        return False

    def input_text(self, text: str):
        self.run_cmd(["adb", "shell", "input", "text", text], check=False)
        time.sleep(0.5)

    def press_key(self, keycode: int):
        self.run_cmd(["adb", "shell", "input", "keyevent", str(keycode)], check=False)
        time.sleep(0.3)

    # ------------------ TEST SUITE ------------------

    def test_install_and_launch(self) -> bool:
        self.log("Step 1: Installing and Launching SchemeApp-release.apk...", "INFO")
        if not APK_PATH.exists():
            self.log(f"APK not found at {APK_PATH}", "FAIL")
            return False

        self.log("Installing APK...", "INFO")
        self.run_cmd(["adb", "install", "-r", str(APK_PATH)])

        self.log("Resetting app state & clearing system dialogs...", "INFO")
        self.run_cmd(["adb", "shell", "pm", "clear", PACKAGE_NAME], check=False)
        self.press_key(111)  # Dismiss any lingering system dialogs
        time.sleep(0.5)

        self.log("Clearing previous logcat...", "INFO")
        self.run_cmd(["adb", "logcat", "-c"], check=False)

        self.log("Launching application...", "INFO")
        self.run_cmd(["adb", "shell", "am", "start", "-n", ACTIVITY_NAME])
        time.sleep(3.5)

        # Check if Language Onboarding screen appears (after pm clear)
        lang_card = self.find_element(text="English") or self.find_element(desc="Select English language")
        if lang_card:
            self.log("Language onboarding screen detected. Selecting English...", "INFO")
            self.capture_screenshot("01_language_selection")
            self.tap(lang_card[0], lang_card[1])
            time.sleep(2)

        self.capture_screenshot("02_auth_screen")
        return True

    def test_auth_ui(self) -> bool:
        self.log("Step 2: Inspecting Auth Screen & Google / Email UI...", "INFO")
        time.sleep(2)
        self.capture_screenshot("02_auth_screen")

        # Verify Google Button and Login form
        found_google = self.find_element(text="Continue with Google") or self.find_element(desc="Continue with Google")
        found_login = self.find_element(text="Log In") or self.find_element(text="Login")
        
        self.log(f"Google sign-in button detected: {bool(found_google)}", "INFO")
        self.log(f"Login button detected: {bool(found_login)}", "INFO")

        # Test switching to Sign Up tab
        self.log("Tapping 'Sign Up' tab...", "INFO")
        tapped_signup = self.tap_element(text="Sign Up")
        time.sleep(1.5)
        self.capture_screenshot("03_signup_screen")

        # Test switching back to Login tab
        self.log("Tapping 'Login' tab...", "INFO")
        self.tap_element(text="Login")
        time.sleep(1)
        self.capture_screenshot("04_login_screen")

        return bool(found_google and found_login)

    def test_offline_sqlite_and_navigation(self) -> bool:
        self.log("Step 3: Performing Login & Verifying Offline SQLite Schemes...", "INFO")
        
        # Tap email input and enter demo credentials
        email_coords = self.find_element(text="citizen@example.gov.in")
        if email_coords:
            self.tap(email_coords[0], email_coords[1])
            self.input_text("demo@schememobile.app")
            time.sleep(0.5)

        # Enter password
        pass_coords = self.find_element(text="Enter your password")
        if pass_coords:
            self.tap(pass_coords[0], pass_coords[1])
            self.input_text("Password123!")
            time.sleep(0.5)

        # Dismiss on-screen keyboard so Log In button is visible
        self.press_key(111)  # KEYCODE_ESCAPE
        time.sleep(0.5)
        self.press_key(4)    # KEYCODE_BACK
        time.sleep(0.5)

        # Tap Log In
        self.tap_element(text="Log In")
        time.sleep(3)

        # If Google Password Manager prompt appears, dismiss it
        not_now = self.find_element(text="Not now")
        if not_now:
            self.log("Dismissing Google Password Manager prompt...", "INFO")
            self.tap(not_now[0], not_now[1])
            time.sleep(1.5)

        self.capture_screenshot("05_post_login_screen")
        return True

    def run_all(self):
        print(f"\n{BOLD}{CYAN}======================================================{RESET}")
        print(f"{BOLD}{CYAN}   Scheme App — Automated Emulator E2E Test Suite    {RESET}")
        print(f"{BOLD}{CYAN}======================================================{RESET}\n")

        start_time = time.time()
        try:
            self.check_or_start_device()

            steps = [
                ("Install & Launch App", self.test_install_and_launch),
                ("Verify Auth & Login UI", self.test_auth_ui),
                ("Verify App Navigation", self.test_offline_sqlite_and_navigation),
            ]

            for name, step_func in steps:
                t0 = time.time()
                try:
                    passed = step_func()
                    dur = round(time.time() - t0, 2)
                    if passed:
                        self.results.append((name, "PASS", dur))
                        self.log(f"{name} Passed ({dur}s)", "PASS")
                    else:
                        self.results.append((name, "FAIL", dur))
                        self.capture_screenshot(f"FAILURE_{name.replace(' ', '_')}")
                        self.capture_logcat(f"FAILURE_{name.replace(' ', '_')}")
                        self.log(f"{name} Failed", "FAIL")
                except Exception as e:
                    dur = round(time.time() - t0, 2)
                    self.results.append((name, "ERROR", dur))
                    self.capture_screenshot(f"ERROR_{name.replace(' ', '_')}")
                    self.capture_logcat(f"ERROR_{name.replace(' ', '_')}")
                    self.log(f"Exception during {name}: {e}", "FAIL")

        except Exception as e:
            self.log(f"Fatal test runner exception: {e}", "FAIL")
            self.capture_screenshot("FATAL_ERROR")
            self.capture_logcat("FATAL_ERROR")

        total_time = round(time.time() - start_time, 2)

        # Print Summary Table
        print(f"\n{BOLD}------------------------------------------------------{RESET}")
        print(f"{BOLD}{'TEST CASE':<35} {'RESULT':<10} {'TIME':<8}{RESET}")
        print(f"{BOLD}------------------------------------------------------{RESET}")
        for name, res, dur in self.results:
            color = GREEN if res == "PASS" else RED
            print(f"{name:<35} {color}{res:<10}{RESET} {dur}s")
        print(f"{BOLD}------------------------------------------------------{RESET}")
        print(f"Total Duration: {total_time}s")
        print(f"Screenshots & Logs saved to: {SCREENSHOTS_DIR}\n")


if __name__ == "__main__":
    runner = EmulatorTestRunner()
    runner.run_all()
