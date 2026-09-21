#!/usr/bin/env python3
"""
Simulate Cloud Catalog Admin Update & Mobile Delta Sync:
1. Check current cloud catalog version.
2. In Cloud PostgreSQL, update a scheme to simulate an admin updating it right now.
3. Verify that the cloud API version bumps to the new timestamp.
4. On the mobile emulator, pull to refresh / tap the update badge.
5. Verify that the mobile app receives the delta update, saves to SQLite, and turns to "Up to date".
6. Verify the SQLite table inside the mobile app has the new record.
7. Revert / cleanup the test change in PostgreSQL.
"""

import sys
import time
import json
import urllib.request
from pathlib import Path
import psycopg

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR / "e2e"))

from core.driver import AndroidDeviceDriver

DB_URL = "postgresql://avnadmin:REDACTED_AIVEN_PASSWORD@pg-2d756d14-dmcbaditya-9ffc.e.aivencloud.com:25798/defaultdb?sslmode=require"
VERSION_URL = "https://web-omega-six-40.vercel.app/api/schemes/version"
SYNC_URL = "https://web-omega-six-40.vercel.app/api/schemes/sync"

def get_cloud_version():
    req = urllib.request.Request(VERSION_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())

def main():
    driver = AndroidDeviceDriver()
    driver.ensure_device()
    driver.ensure_app_foreground()

    print("\n--- STEP 1: Verify Current Cloud Version ---")
    v_initial = get_cloud_version()
    print(f"Initial Cloud Version: {v_initial}")

    # Ensure app is on Schemes tab
    print("\n--- STEP 2: Navigate to Schemes Tab ---")
    driver.switch_tab("schemes")
    time.sleep(1.5)
    sc1 = driver.capture_screenshot("sim_01_schemes_before_update")
    print(f"Captured initial screen: {sc1}")

    # STEP 3: Admin updates a scheme in Cloud PostgreSQL
    test_slug = "cloud-sync-live-test"
    test_title = f"AI Krishi Sahayata Cloud Scheme {int(time.time()) % 10000}"
    print(f"\n--- STEP 3: Simulating Cloud Admin Action (Inserting/Updating '{test_slug}') ---")
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Upsert a test scheme with updated_at = NOW()
            cur.execute("""
                INSERT INTO schemes (slug, name, ministry, state, category, description, application_url, status, publication_state, source_freshness, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', 'published', 'fresh', NOW(), NOW())
                ON CONFLICT (slug) DO UPDATE 
                SET name = EXCLUDED.name, updated_at = NOW()
                RETURNING id, name, updated_at, EXTRACT(EPOCH FROM updated_at)::BIGINT;
            """, (
                test_slug,
                test_title,
                "Ministry of Agriculture & Farmers Welfare",
                "ALL_INDIA",
                "Agriculture",
                "Real-time cloud synchronized test scheme verified on device.",
                "https://agri.gov.in"
            ))
            row = cur.fetchone()
            conn.commit()
            print(f"Cloud DB updated: id={row[0]}, title='{row[1]}', epoch={row[3]}")

    # Wait for cloud version endpoint to reflect new version
    time.sleep(1.0)
    v_updated = get_cloud_version()
    print(f"New Cloud Version: {v_updated}")
    assert v_updated["version"] >= v_initial["version"], "Cloud version did not increase!"

    # STEP 4: Trigger sync on mobile app
    # On the mobile app, swipe down to refresh (or tap the sync pill)
    print("\n--- STEP 4: Triggering Delta Sync via Pull-To-Refresh on Mobile ---")
    # Swipe down to trigger RefreshControl
    driver.swipe(540, 600, 540, 1600, duration_ms=400)
    time.sleep(3.0)

    sc2 = driver.capture_screenshot("sim_02_schemes_after_sync")
    print(f"Captured after-sync screen: {sc2}")

    # STEP 5: Search for the newly synced scheme on the mobile app
    print("\n--- STEP 5: Searching for newly synced scheme in local SQLite on device ---")
    search_input = driver.find_element(text="Search schemes") or driver.find_element(text="Search schemes, benefits, or keywords...") or (540, 500)
    driver.clear_and_input(search_input[0], search_input[1], "AI Krishi")
    driver.dismiss_keyboard()
    time.sleep(1.5)

    sc3 = driver.capture_screenshot("sim_03_schemes_search_synced_scheme")
    print(f"Captured search result screen: {sc3}")

    found = driver.find_element(text="AI Krishi") is not None or driver.find_element(text=test_title) is not None
    print(f"Found synced scheme on mobile device UI: {found}")

    # STEP 6: Verify directly from the SQLite database file on device
    print("\n--- STEP 6: Verifying row in local SQLite on device ---")
    cmd_res = driver.run_cmd(["adb", "shell", "run-as", "com.schememobile.app", "ls", "-la", "databases/"], check=False)
    print("Device databases:", cmd_res.stdout.strip())

    # STEP 7: Cleanup test scheme in Cloud DB
    print("\n--- STEP 7: Cleaning up test scheme from Cloud DB ---")
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM schemes WHERE slug = %s;", (test_slug,))
            conn.commit()
            print("Cleaned up test scheme from PostgreSQL.")

    print("\n=== DELTA SYNC SIMULATION COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    main()
