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
from typing import Optional, Tuple, List, Union

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
        self._cached_dump: Optional[ET.Element] = None
        self._cached_dump_time: float = 0.0
        self._dump_ttl: float = 0.8
        self._authenticated: bool = False
        SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    def invalidate_ui_dump(self):
        """Invalidate cached UI dump when an action mutates screen state."""
        self._cached_dump = None
        self._cached_dump_time = 0.0

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
        self.adb("shell", "settings", "put", "secure", "stylus_handwriting_enabled", "0", check=False)
        self.adb("shell", "settings", "put", "secure", "show_ime_with_hard_keyboard", "1", check=False)

    def install_app(self, apk_path: Path = APK_PATH):
        if not apk_path.exists():
            raise FileNotFoundError(f"APK file not found at {apk_path}")
        self.adb("install", "-r", str(apk_path))

    def clear_app_data(self, package_name: str = PACKAGE_NAME):
        self._authenticated = False
        self.invalidate_ui_dump()
        self.adb("shell", "pm", "clear", package_name, check=False)

    def start_app(self, activity: str = MAIN_ACTIVITY):
        self.invalidate_ui_dump()
        self.adb("shell", "am", "start", "-n", activity)

    def stop_app(self, package_name: str = PACKAGE_NAME):
        self.invalidate_ui_dump()
        self.adb("shell", "am", "force-stop", package_name, check=False)

    def restart_app(self):
        self.stop_app()
        time.sleep(0.3)
        self.start_app()

    def reset_auth_state(self) -> bool:
        """Resets citizen auth session so the app is cleanly at /auth ready for login testing."""
        self._authenticated = False
        self.invalidate_ui_dump()

        # 1. Fast check if already on /auth screen (avoids heavy app restart between suites)
        if self.find_element(text=["Log In", "Continue with Google", "Login"]):
            return True

        # 2. Remove SecureStore JWT token so root router automatically purges MMKV session and routes to /auth
        self.adb("root", check=False)
        self.adb("shell", "rm", "-f", f"/data/data/{PACKAGE_NAME}/shared_prefs/SecureStore.xml", check=False)
        self.restart_app()
        time.sleep(1.2)
        self.dismiss_system_dialogs()

        # 3. Check if already on /auth screen
        if self.find_element(text=["Log In", "Continue with Google", "Login"]):
            return True

        # 4. If still in tabs (UI fallback logout)
        avatar = self.find_element(desc="Open Citizen Profile") or self.find_element(text="")
        if avatar:
            self.tap(avatar[0], avatar[1], sleep_after=0.6)
            settings_btn = self.find_element(text="Settings")
            if settings_btn:
                self.tap(settings_btn[0], settings_btn[1], sleep_after=0.6)
                self.scroll_down()
                logout_btn = self.find_element(text=["Logout", "Log Out"])
                if logout_btn:
                    self.tap(logout_btn[0], logout_btn[1], sleep_after=0.5)
                    confirm_btn = self.find_element(text=["Log Out", "Yes, Log Out"])
                    if confirm_btn:
                        self.tap(confirm_btn[0], confirm_btn[1], sleep_after=0.8)

        return self.wait_for_any_element(texts=["Continue with Google", "Log In", "Login"], timeout=4.0) is not None

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

    def get_ui_dump(self, force: bool = False) -> Optional[ET.Element]:
        now = time.time()
        if not force and self._cached_dump is not None and (now - self._cached_dump_time) < self._dump_ttl:
            return self._cached_dump

        try:
            self.adb("shell", "uiautomator", "dump", "/sdcard/window_dump.xml", check=False, timeout=8)
        except Exception:
            self.adb("shell", "pkill", "-9", "-f", "uiautomator", check=False, timeout=3)
            time.sleep(0.2)
            return None

        res = self.adb("shell", "cat", "/sdcard/window_dump.xml", check=False, timeout=4)
        xml_str = res.stdout.strip()
        if not xml_str or not xml_str.startswith("<?xml"):
            time.sleep(0.2)
            res = self.adb("shell", "cat", "/sdcard/window_dump.xml", check=False, timeout=3)
            xml_str = res.stdout.strip()

        if xml_str.startswith("<?xml"):
            try:
                tree = ET.fromstring(xml_str)
                self._cached_dump = tree
                self._cached_dump_time = time.time()
                return tree
            except Exception:
                pass
        return None

    def find_element(
        self,
        text: Union[str, List[str], None] = None,
        desc: Union[str, List[str], None] = None,
        exact: bool = False,
    ) -> Optional[Tuple[int, int]]:
        """Finds center coordinates (x, y) of an element matching text or content-description."""
        root = self.get_ui_dump()
        if root is None:
            return None

        texts = [text] if isinstance(text, str) else (text or [])
        descs = [desc] if isinstance(desc, str) else (desc or [])

        for node in root.iter("node"):
            node_text = node.get("text", "")
            node_desc = node.get("content-desc", "")

            matched = False
            for t in texts:
                if exact and t == node_text:
                    matched = True
                    break
                elif not exact and t.lower() in node_text.lower():
                    matched = True
                    break

            if not matched:
                for d in descs:
                    if exact and d == node_desc:
                        matched = True
                        break
                    elif not exact and d.lower() in node_desc.lower():
                        matched = True
                        break

            if matched:
                bounds = node.get("bounds", "")
                m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
                if m:
                    x1, y1, x2, y2 = map(int, m.groups())
                    return (x1 + x2) // 2, (y1 + y2) // 2

        return None

    def find_elements_batch(
        self,
        queries: List[Union[str, List[str]]],
        key_type: str = "text",
        exact: bool = False,
    ) -> List[Optional[Tuple[int, int]]]:
        """Resolves multiple element coordinates in a single UI dump, preventing sequential 2-second dumps."""
        root = self.get_ui_dump()
        if root is None:
            return [None] * len(queries)

        results: List[Optional[Tuple[int, int]]] = [None] * len(queries)
        for node in root.iter("node"):
            node_text = node.get("text", "")
            node_desc = node.get("content-desc", "")
            bounds = node.get("bounds", "")
            m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
            if not m:
                continue
            cx = (int(m.group(1)) + int(m.group(3))) // 2
            cy = (int(m.group(2)) + int(m.group(4))) // 2

            for idx, q in enumerate(queries):
                if results[idx] is not None:
                    continue
                targets = [q] if isinstance(q, str) else q
                for t in targets:
                    val = node_text if key_type == "text" else node_desc
                    if (exact and t == val) or (not exact and t.lower() in val.lower()):
                        results[idx] = (cx, cy)
                        break
        return results

    def wait_for_element(
        self,
        text: Union[str, List[str], None] = None,
        desc: Union[str, List[str], None] = None,
        timeout: float = 10.0,
        exact: bool = False,
        interval: float = 0.3,
    ) -> Optional[Tuple[int, int]]:
        """Polls for element until timeout."""
        start = time.time()
        while time.time() - start < timeout:
            coords = self.find_element(text=text, desc=desc, exact=exact)
            if coords:
                return coords
            self.invalidate_ui_dump()
            time.sleep(interval)
        return None

    def wait_for_any_element(
        self,
        texts: Optional[List[str]] = None,
        descs: Optional[List[str]] = None,
        timeout: float = 10.0,
        exact: bool = False,
        interval: float = 0.3,
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
            self.invalidate_ui_dump()
            time.sleep(interval)
        return None

    def tap(self, x: int, y: int, sleep_after: float = 0.25, invalidate: bool = True):
        self.adb("shell", "input", "tap", str(x), str(y), check=False)
        if invalidate:
            self.invalidate_ui_dump()
        time.sleep(sleep_after)

    def tap_element(
        self,
        text: Union[str, List[str], None] = None,
        desc: Union[str, List[str], None] = None,
        timeout: float = 5.0,
        exact: bool = False,
    ) -> bool:
        coords = self.wait_for_element(text=text, desc=desc, timeout=timeout, exact=exact)
        if coords:
            self.tap(coords[0], coords[1])
            return True
        return False

    def is_logged_in(self) -> bool:
        """Fast check if the app is currently inside authenticated tabs (single-pass tree inspection)."""
        root = self.get_ui_dump()
        if root is None:
            return False
        for node in root.iter("node"):
            t = node.get("text", "")
            d = node.get("content-desc", "")
            if (
                d == "Open Citizen Profile"
                or t == "Namaste!"
                or any(tab_name in t or tab_name in d for tab_name in ("Advisor", "Schemes", "Vault", "Check"))
            ):
                return True
        return False

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

    def fast_login(self, use_google: bool = True, sleep_after: float = 0.3) -> bool:
        """
        Fast streamlined login for test suites and manual runner flag.
        If already in tabs, returns True immediately (<10ms).
        """
        if self._authenticated:
            return True
        if self.is_logged_in():
            self._authenticated = True
            return True

        self.ensure_app_foreground()

        # If Google sign-in requested, try it first
        if use_google:
            try:
                if self.google_sign_in(timeout=4.0):
                    self._authenticated = True
                    return True
            except Exception:
                pass

        # Email credentials fast login fallback (direct coordinates on Pixel 9)
        from .fixtures import TEST_USER
        email_coords = (571, 1280)
        pass_coords = (530, 1486)
        login_btn_coords = (540, 1730)

        self.clear_and_input(email_coords[0], email_coords[1], TEST_USER["email"], sleep_after=0.1)
        self.clear_and_input(pass_coords[0], pass_coords[1], TEST_USER["password"], sleep_after=0.1)
        self.dismiss_keyboard()
        self.tap(login_btn_coords[0], login_btn_coords[1], sleep_after=sleep_after)

        ok = self.wait_for_any_element(
            texts=["Advisor", "Schemes", "Vault", "Check"],
            descs=["Open Citizen Profile", "Advisor", "Schemes"],
            timeout=5.0,
        ) is not None
        if ok:
            self._authenticated = True
        return ok

    def ensure_logged_in(self) -> bool:
        if self._authenticated and self.is_logged_in():
            return True
        if self.is_logged_in():
            self._authenticated = True
            return True
        # If left inside a modal / detail screen, attempt back key to pop to root tabs
        self.press_key(KEYCODE_BACK, sleep_after=0.2)
        if self.is_logged_in():
            self._authenticated = True
            return True
        return self.fast_login()

    def switch_tab(self, tab: str, sleep_after: float = 0.25) -> bool:
        """
        Reliably switches to one of the 4 main tabs: 'advisor', 'vault', 'check', 'schemes'.
        Taps directly on known tab coordinates without dumping XML, running in <300ms.
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
        if tab_key in tab_x_map:
            self.tap(tab_x_map[tab_key], 2290, sleep_after=sleep_after)
            return True
        return False

    def input_text(self, text: str, sleep_after: float = 0.2):
        escaped = text.replace(" ", "%s").replace("&", "\\&").replace("!", "\\!")
        self.adb("shell", "input", "text", escaped, check=False)
        self.invalidate_ui_dump()
        time.sleep(sleep_after)

    def clear_and_input(self, x: int, y: int, text: str, sleep_after: float = 0.2):
        """Taps element, selects all, clears cleanly, and inputs new text in a single adb shell pipeline."""
        escaped = text.replace(" ", "%s").replace("&", "\\&").replace("!", "\\!")
        cmd = f"input tap {x} {y} && input keyevent 29 --meta 113 && input keyevent 67 && input keyevent 67 67 67 67 67 67 67 67 && input text {escaped}"
        self.adb("shell", cmd, check=False)
        self.invalidate_ui_dump()
        time.sleep(sleep_after)

    def press_key(self, keycode: int, sleep_after: float = 0.15):
        self.adb("shell", "input", "keyevent", str(keycode), check=False)
        self.invalidate_ui_dump()
        time.sleep(sleep_after)

    def is_keyboard_shown(self) -> bool:
        res = self.adb("shell", "dumpsys input_method | grep 'mInputShown=true'", check=False)
        return bool(res.stdout.strip())

    def dismiss_keyboard(self):
        if self.is_keyboard_shown():
            self.press_key(KEYCODE_ESCAPE, sleep_after=0.15)

    def ensure_app_foreground(self):
        res = self.adb("shell", "dumpsys window | grep 'mCurrentFocus.*MainActivity'", check=False)
        if not res.stdout.strip():
            self.start_app()
            time.sleep(0.5)

    def scroll_down(self):
        # Swipe from center-bottom to center-top
        self.adb("shell", "input", "swipe", "540", "1500", "540", "500", "200", check=False)
        self.invalidate_ui_dump()
        time.sleep(0.3)

    def scroll_up(self):
        self.adb("shell", "input", "swipe", "540", "500", "540", "1500", "200", check=False)
        self.invalidate_ui_dump()
        time.sleep(0.3)

    def swipe(self, x1: int, y1: int, x2: int, y2: int, duration_ms: int = 200):
        self.adb("shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration_ms), check=False)
        self.invalidate_ui_dump()
        time.sleep(0.25)

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
        """Fast-checks if a system dialog/popup is on top before attempting an expensive UI dump."""
        res = self.adb("shell", "dumpsys window | grep 'mCurrentFocus.*MainActivity'", check=False)
        if res.stdout.strip():
            # MainActivity has direct focus; no external system popup is active!
            return

        root = self.get_ui_dump(force=True)
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
                        self.tap((x1 + x2) // 2, (y1 + y2) // 2, sleep_after=0.2)
                        return
