#!/usr/bin/env python3
"""
Android Device Driver for E2E Automation
Zero-dependency implementation using native adb and uiautomator.
"""

import os
import re
import sys
import time
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional, Tuple, List

from .fixtures import (
    APK_PATH,
    PACKAGE_NAME,
    MAIN_ACTIVITY,
    DEFAULT_AVD,
    SCREENSHOTS_DIR,
    REPORTS_DIR,
    KEYCODE_BACK,
    KEYCODE_ESCAPE,
)


class AndroidDeviceDriver:
    def __init__(self, avd_name: str = DEFAULT_AVD):
        self.avd_name = avd_name
        self.device_id: Optional[str] = None
        SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    def run_cmd(self, cmd: List[str], check: bool = True, timeout: int = 60) -> subprocess.CompletedProcess:
        try:
            return subprocess.run(
                cmd,
                check=check,
                text=True,
                capture_output=True,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired:
            print(f"[WARN] Command timed out: {' '.join(cmd)}")
            raise

    def adb(self, *args: str, check: bool = True, timeout: int = 60) -> subprocess.CompletedProcess:
        cmd = ["adb"]
        if self.device_id and self.device_id != "emulator":
            cmd.extend(["-s", self.device_id])
        cmd.extend(args)
        return self.run_cmd(cmd, check=check, timeout=timeout)

    def ensure_device(self) -> str:
        """Detect or boot emulator and ensure it is ready."""
        res = self.run_cmd(["adb", "devices"])
        lines = [line.strip() for line in res.stdout.strip().split("\n")[1:] if line.strip()]

        for line in lines:
            parts = line.split()
            if len(parts) >= 2 and parts[1] == "device":
                self.device_id = parts[0]
                self.configure_device()
                return self.device_id

        # Boot emulator if none found
        print(f"[INFO] Booting emulator '{self.avd_name}'...")
        subprocess.Popen(
            ["emulator", "-avd", self.avd_name, "-no-snapshot-load", "-no-boot-anim"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        self.run_cmd(["adb", "wait-for-device"])

        # Wait for system boot completed
        for _ in range(60):
            res = self.run_cmd(["adb", "shell", "getprop", "sys.boot_completed"], check=False)
            if res.stdout.strip() == "1":
                self.device_id = "emulator"
                time.sleep(2)
                self.configure_device()
                return self.device_id
            time.sleep(2)

        raise RuntimeError("Timed out waiting for Android emulator boot.")

    def configure_device(self):
        """Disables animations and Google Autofill/Password popups for stable E2E testing."""
        self.adb("shell", "settings", "put", "global", "window_animation_scale", "0", check=False)
        self.adb("shell", "settings", "put", "global", "transition_animation_scale", "0", check=False)
        self.adb("shell", "settings", "put", "global", "animator_duration_scale", "0", check=False)
        self.adb("shell", "settings", "put", "secure", "autofill_service", "null", check=False)
        self.adb("shell", "settings", "put", "secure", "credential_service", "null", check=False)
        self.adb("shell", "settings", "put", "secure", "autofill_credential_protection_policy", "0", check=False)

    def install_app(self, apk_path: Path = APK_PATH):
        if not apk_path.exists():
            raise FileNotFoundError(f"APK file not found at {apk_path}")
        self.adb("install", "-r", str(apk_path))

    def clear_app_data(self, package_name: str = PACKAGE_NAME):
        self.adb("shell", "pm", "clear", package_name, check=False)

    def start_app(self, activity: str = MAIN_ACTIVITY):
        self.adb("shell", "am", "start", "-n", activity)

    def stop_app(self, package_name: str = PACKAGE_NAME):
        self.adb("shell", "am", "force-stop", package_name, check=False)

    def restart_app(self):
        self.stop_app()
        time.sleep(0.5)
        self.start_app()

    def reset_auth_state(self) -> bool:
        """Resets citizen auth session so the app is cleanly at /auth ready for login testing."""
        # 1. Remove SecureStore JWT token so root router automatically purges MMKV session and routes to /auth
        self.adb("root", check=False)
        self.adb("shell", "rm", "-f", f"/data/data/{PACKAGE_NAME}/shared_prefs/SecureStore.xml", check=False)
        self.restart_app()
        time.sleep(2.0)
        self.dismiss_system_dialogs()

        # 2. Check if already on /auth screen
        if self.find_element(text="Log In") or self.find_element(text="Continue with Google"):
            return True

        # 3. If still in tabs (UI fallback logout)
        avatar = self.find_element(desc="Open Citizen Profile") or self.find_element(text="")
        if avatar:
            self.tap(avatar[0], avatar[1], sleep_after=1.0)
            settings_btn = self.find_element(text="Settings")
            if settings_btn:
                self.tap(settings_btn[0], settings_btn[1], sleep_after=1.0)
                self.scroll_down()
                logout_btn = self.find_element(text="Logout") or self.find_element(text="Log Out")
                if logout_btn:
                    self.tap(logout_btn[0], logout_btn[1], sleep_after=0.8)
                    confirm_btn = self.find_element(text="Log Out") or self.find_element(text="Yes, Log Out")
                    if confirm_btn:
                        self.tap(confirm_btn[0], confirm_btn[1], sleep_after=1.5)

        return self.wait_for_any_element(texts=["Continue with Google", "Log In", "Login"], timeout=6.0) is not None

    def capture_screenshot(self, name: str) -> Path:
        sanitized = re.sub(r"[^\w\-_\.]", "_", name)
        out_path = SCREENSHOTS_DIR / f"{sanitized}.png"
        try:
            with open(out_path, "wb") as f:
                cmd = ["adb"]
                if self.device_id and self.device_id != "emulator":
                    cmd.extend(["-s", self.device_id])
                cmd.extend(["exec-out", "screencap", "-p"])
                subprocess.run(cmd, stdout=f, check=True)
            return out_path
        except Exception as e:
            print(f"[WARN] Failed capturing screenshot: {e}")
            return out_path

    def capture_logcat(self, name: str) -> Path:
        sanitized = re.sub(r"[^\w\-_\.]", "_", name)
        out_path = REPORTS_DIR / f"{sanitized}_logcat.txt"
        try:
            res = self.adb("logcat", "-d", "-s", "ReactNative:V", "ReactNativeJS:V", "AndroidRuntime:E", check=False)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(res.stdout)
            return out_path
        except Exception as e:
            print(f"[WARN] Failed capturing logcat: {e}")
            return out_path

    def clear_logcat(self):
        self.adb("logcat", "-c", check=False)

    def get_ui_dump(self) -> Optional[ET.Element]:
        try:
            self.adb("shell", "uiautomator", "dump", "/sdcard/window_dump.xml", check=False, timeout=6)
        except Exception:
            self.adb("shell", "pkill", "-9", "-f", "uiautomator", check=False, timeout=3)
            time.sleep(0.3)
            return None
        res = self.adb("shell", "cat", "/sdcard/window_dump.xml", check=False, timeout=4)
        xml_str = res.stdout.strip()
        if not xml_str or not xml_str.startswith("<?xml"):
            time.sleep(0.4)
            res = self.adb("shell", "cat", "/sdcard/window_dump.xml", check=False, timeout=4)
            xml_str = res.stdout.strip()
        if xml_str.startswith("<?xml"):
            try:
                return ET.fromstring(xml_str)
            except Exception:
                pass
        return None

    def find_element(
        self,
        text: Optional[str] = None,
        desc: Optional[str] = None,
        exact: bool = False,
    ) -> Optional[Tuple[int, int]]:
        """Finds center coordinates (x, y) of an element matching text or content-description."""
        root = self.get_ui_dump()
        if root is None:
            return None

        for node in root.iter("node"):
            node_text = node.get("text", "")
            node_desc = node.get("content-desc", "")

            matched = False
            if text:
                if exact and text == node_text:
                    matched = True
                elif not exact and text.lower() in node_text.lower():
                    matched = True
            if desc and not matched:
                if exact and desc == node_desc:
                    matched = True
                elif not exact and desc.lower() in node_desc.lower():
                    matched = True

            if matched:
                bounds = node.get("bounds", "")
                m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                if m:
                    x1, y1, x2, y2 = map(int, m.groups())
                    return (x1 + x2) // 2, (y1 + y2) // 2

        return None

    def wait_for_element(
        self,
        text: Optional[str] = None,
        desc: Optional[str] = None,
        timeout: float = 10.0,
        exact: bool = False,
        interval: float = 0.8,
    ) -> Optional[Tuple[int, int]]:
        """Polls for element until timeout."""
        start = time.time()
        while time.time() - start < timeout:
            coords = self.find_element(text=text, desc=desc, exact=exact)
            if coords:
                return coords
            time.sleep(interval)
        return None

    def wait_for_any_element(
        self,
        texts: Optional[List[str]] = None,
        descs: Optional[List[str]] = None,
        timeout: float = 10.0,
        exact: bool = False,
        interval: float = 0.8,
    ) -> Optional[Tuple[int, int]]:
        """Checks multiple candidate texts/descs in a single UI dump per tick to prevent UiAutomation lock collision."""
        start = time.time()
        texts = texts or []
        descs = descs or []
        while time.time() - start < timeout:
            root = self.get_ui_dump()
            if root is not None:
                for node in root.iter("node"):
                    node_text = node.get("text", "")
                    node_desc = node.get("content-desc", "")
                    for t in texts:
                        if (exact and t == node_text) or (not exact and t.lower() in node_text.lower()):
                            bounds = node.get("bounds", "")
                            m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                            if m:
                                x1, y1, x2, y2 = map(int, m.groups())
                                return (x1 + x2) // 2, (y1 + y2) // 2
                    for d in descs:
                        if (exact and d == node_desc) or (not exact and d.lower() in node_desc.lower()):
                            bounds = node.get("bounds", "")
                            m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                            if m:
                                x1, y1, x2, y2 = map(int, m.groups())
                                return (x1 + x2) // 2, (y1 + y2) // 2
            time.sleep(interval)
        return None

    def tap(self, x: int, y: int, sleep_after: float = 0.5):
        self.adb("shell", "input", "tap", str(x), str(y), check=False)
        time.sleep(sleep_after)

    def tap_element(
        self,
        text: Optional[str] = None,
        desc: Optional[str] = None,
        timeout: float = 5.0,
        exact: bool = False,
    ) -> bool:
        coords = self.wait_for_element(text=text, desc=desc, timeout=timeout, exact=exact)
        if coords:
            self.tap(coords[0], coords[1])
            return True
        return False

    def is_logged_in(self) -> bool:
        """Fast check if the app is currently inside authenticated tabs."""
        return (
            self.find_element(desc="Open Citizen Profile") is not None
            or self.find_element(text="Namaste!") is not None
            or self.find_element(desc=", Advisor") is not None
            or self.find_element(desc=", Schemes") is not None
            or self.find_element(desc=", Vault") is not None
        )

    def google_sign_in(self, timeout: float = 12.0) -> bool:
        """
        Authenticates via Google One-Tap / Google Sign-In on device.
        Taps 'Continue with Google', selects the available Google account,
        and waits for session token creation and transition into tabs.
        """
        if self.is_logged_in():
            return True

        self.ensure_app_foreground()
        self.dismiss_system_dialogs()

        # Tap 'Continue with Google'
        google_btn = (
            self.find_element(text="Continue with Google")
            or self.find_element(desc="Continue with Google")
            or (568, 998)
        )
        self.tap(google_btn[0], google_btn[1], sleep_after=1.5)

        # Look for Google Account in picker modal
        root = self.get_ui_dump()
        acc_coords = None
        if root is not None:
            for n in root.iter("node"):
                t = n.get("text", "")
                if "@gmail.com" in t or "@google.com" in t:
                    bounds = n.get("bounds", "")
                    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                    if m:
                        acc_coords = (
                            (int(m.group(1)) + int(m.group(3))) // 2,
                            (int(m.group(2)) + int(m.group(4))) // 2,
                        )
                        break

        if acc_coords:
            self.tap(acc_coords[0], acc_coords[1], sleep_after=2.0)

        # Wait for transition to authenticated tabs
        return self.wait_for_any_element(
            texts=["Advisor", "Schemes", "Vault", "Check"],
            descs=["Open Citizen Profile", "Advisor", "Schemes"],
            timeout=timeout,
        ) is not None

    def fast_login(self, use_google: bool = True, sleep_after: float = 1.5) -> bool:
        """
        Fast streamlined login for test suites and manual runner flag.
        If already in tabs, returns True immediately (<50ms).
        If use_google is True and on /auth, attempts Google Sign-In first;
        falls back to instant email credentials submission if needed.
        """
        if self.is_logged_in():
            return True

        self.ensure_app_foreground()

        # If Google sign-in requested, try it first
        if use_google:
            try:
                if self.google_sign_in(timeout=8.0):
                    return True
            except Exception:
                pass

        # Email credentials fast login fallback
        root = self.get_ui_dump()
        email_coords = (571, 1280)
        pass_coords = (530, 1486)
        login_btn_coords = (540, 1730)

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
                elif node.get("text") == "Log In":
                    bounds = node.get("bounds", "")
                    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                    if m:
                        login_btn_coords = (
                            (int(m.group(1)) + int(m.group(3))) // 2,
                            (int(m.group(2)) + int(m.group(4))) // 2,
                        )

        from .fixtures import TEST_USER
        self.clear_and_input(email_coords[0], email_coords[1], TEST_USER["email"])
        self.clear_and_input(pass_coords[0], pass_coords[1], TEST_USER["password"])
        self.dismiss_keyboard()
        time.sleep(0.2)
        self.tap(login_btn_coords[0], login_btn_coords[1], sleep_after=sleep_after)

        return self.wait_for_any_element(
            texts=["Advisor", "Schemes", "Vault", "Check"],
            descs=["Open Citizen Profile", "Advisor", "Schemes"],
            timeout=8.0,
        ) is not None

    def ensure_logged_in(self) -> bool:
        return self.fast_login()

    def switch_tab(self, tab: str, sleep_after: float = 1.2) -> bool:
        """
        Reliably switches to one of the 4 main tabs: 'advisor', 'vault', 'check', 'schemes'.
        Ensures authenticated session, dismisses soft-keyboard, queries tab bar bounds,
        and taps safely above the Android system navigation gesture zone (y <= 2280).
        """
        self.ensure_logged_in()
        self.dismiss_keyboard()
        tab_x_map = {
            "advisor": 135,
            "vault": 405,
            "check": 675,
            "schemes": 945,
        }
        tab_key = tab.lower().strip()
        capitalized = tab_key.capitalize()

        # Try finding by tab content-desc first (e.g. ', Schemes' or 'Schemes')
        root = self.get_ui_dump()
        if root is not None:
            for node in root.iter("node"):
                desc = node.get("content-desc", "")
                text = node.get("text", "")
                if (capitalized in desc or capitalized in text) and "View" in node.get("class", ""):
                    bounds = node.get("bounds", "")
                    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                    if m:
                        x1, y1, x2, y2 = map(int, m.groups())
                        if y1 >= 2200:
                            tap_x = (x1 + x2) // 2
                            tap_y = min((y1 + y2) // 2, 2280)
                            self.tap(tap_x, tap_y, sleep_after=sleep_after)
                            return True

        # Fallback to calculated coordinate at y=2280
        if tab_key in tab_x_map:
            self.tap(tab_x_map[tab_key], 2280, sleep_after=sleep_after)
            return True
        return False

    def input_text(self, text: str, sleep_after: float = 0.5):
        # Escape spaces and shell-sensitive characters for adb shell input text
        escaped = text.replace(" ", "%s").replace("&", "\\&").replace("!", "\\!")
        self.adb("shell", "input", "text", escaped, check=False)
        time.sleep(sleep_after)

    def clear_and_input(self, x: int, y: int, text: str, sleep_after: float = 0.5):
        """Taps element, selects all and clears cleanly, and inputs new text."""
        self.tap(x, y, sleep_after=0.2)
        # Select all (Ctrl+A) and delete
        self.adb("shell", "input", "keyevent", "29", "--meta", "113", check=False)
        self.adb("shell", "input", "keyevent", "67", check=False)
        # Fallback quick backspaces
        self.adb("shell", "input", "keyevent", *(["67"] * 8), check=False)
        time.sleep(0.1)
        # Input new text
        self.input_text(text, sleep_after=sleep_after)

    def press_key(self, keycode: int, sleep_after: float = 0.3):
        self.adb("shell", "input", "keyevent", str(keycode), check=False)
        time.sleep(sleep_after)

    def is_keyboard_shown(self) -> bool:
        res = self.adb("shell", "dumpsys", "input_method", check=False)
        return "mInputShown=true" in res.stdout

    def dismiss_keyboard(self):
        for _ in range(3):
            if not self.is_keyboard_shown():
                break
            # KEYCODE_ESCAPE (111) dismisses soft keyboard without triggering onBackPressed
            self.press_key(KEYCODE_ESCAPE, sleep_after=0.3)

    def ensure_app_foreground(self):
        res = self.adb("shell", "dumpsys", "activity", "activities", check=False)
        if PACKAGE_NAME not in res.stdout:
            self.start_app()
            time.sleep(1.5)

    def scroll_down(self):
        # Swipe from center-bottom to center-top
        self.adb("shell", "input", "swipe", "540", "1500", "540", "500", "300", check=False)
        time.sleep(0.8)

    def scroll_up(self):
        self.adb("shell", "input", "swipe", "540", "500", "540", "1500", "300", check=False)
        time.sleep(0.8)

    def swipe(self, x1: int, y1: int, x2: int, y2: int, duration_ms: int = 300):
        self.adb("shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration_ms), check=False)
        time.sleep(0.5)

    def find_edit_text(self, password: bool = False) -> Optional[Tuple[int, int]]:
        root = self.get_ui_dump()
        if root is None:
            return None
        target_pw = "true" if password else "false"
        for node in root.iter("node"):
            if "EditText" in node.get("class", ""):
                if node.get("password") == target_pw:
                    bounds = node.get("bounds", "")
                    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                    if m:
                        x1, y1, x2, y2 = map(int, m.groups())
                        return (x1 + x2) // 2, (y1 + y2) // 2
        return None

    def dismiss_system_dialogs(self):
        """Dismiss Google Password Manager, Autofill, Forgot Password modal, or system dialogs in a single pass."""
        root = self.get_ui_dump()
        if root is None:
            return

        dismiss_texts = ["Back to Login", "Never", "Not now", "No thanks", "Cancel", "Deny", "Dismiss", "Close app", "Wait"]
        for node in root.iter("node"):
            node_text = node.get("text", "")
            for dt in dismiss_texts:
                if dt.lower() == node_text.lower():
                    bounds = node.get("bounds", "")
                    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                    if m:
                        x1, y1, x2, y2 = map(int, m.groups())
                        self.tap((x1 + x2) // 2, (y1 + y2) // 2, sleep_after=0.4)
                        return
