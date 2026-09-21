#!/usr/bin/env python3
"""
E2E Test Reporter
Outputs rich console logs and generates Markdown + HTML reports with embedded screenshots.
"""

import time
from pathlib import Path
from typing import List, Dict, Any, Optional

from .fixtures import REPORTS_DIR

# Terminal Colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"


class E2EReporter:
    def __init__(self, title: str = "Scheme Mobile App — E2E Test Suite"):
        self.title = title
        self.start_time = time.time()
        self.records: List[Dict[str, Any]] = []
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    def log(self, message: str, status: str = "INFO"):
        color = {
            "INFO": CYAN,
            "PASS": GREEN,
            "FAIL": RED,
            "WARN": YELLOW,
            "STEP": MAGENTA,
        }.get(status, CYAN)
        prefix = f"{color}[{status}]{RESET}"
        print(f"{prefix} {message}")

    def record(
        self,
        module: str,
        test_name: str,
        status: str,
        duration: float,
        screenshot: Optional[Path] = None,
        logcat: Optional[Path] = None,
        note: str = "",
    ):
        self.records.append({
            "module": module,
            "test_name": test_name,
            "status": status,
            "duration": round(duration, 2),
            "screenshot": screenshot,
            "logcat": logcat,
            "note": note,
        })
        self.log(f"{test_name} ({round(duration, 2)}s) {note}", status=status)

    def generate_markdown(self) -> Path:
        out_file = REPORTS_DIR / "summary.md"
        total_time = round(time.time() - self.start_time, 2)
        total = len(self.records)
        passed = sum(1 for r in self.records if r["status"] == "PASS")
        failed = sum(1 for r in self.records if r["status"] == "FAIL")

        lines = [
            f"# {self.title}",
            "",
            f"- **Date**: {time.strftime('%Y-%m-%d %H:%M:%S')}",
            f"- **Total Duration**: {total_time}s",
            f"- **Total Tests**: {total} | **Passed**: {passed} | **Failed**: {failed}",
            "",
            "| Module | Test Case | Status | Time | Screenshot | Note |",
            "|:---|:---|:---:|:---:|:---|:---|",
        ]

        for r in self.records:
            if r["status"] == "PASS":
                status_badge = "✅ PASS"
            elif r["status"] == "WARN":
                status_badge = "⚠️ WARN"
            else:
                status_badge = "❌ FAIL"
            sc_link = f"[{r['screenshot'].name}](screenshots/{r['screenshot'].name})" if r["screenshot"] else "-"
            lines.append(
                f"| {r['module']} | {r['test_name']} | {status_badge} | {r['duration']}s | {sc_link} | {r['note']} |"
            )

        with open(out_file, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        return out_file

    def generate_html(self) -> Path:
        out_file = REPORTS_DIR / "index.html"
        total_time = round(time.time() - self.start_time, 2)
        total = len(self.records)
        passed = sum(1 for r in self.records if r["status"] == "PASS")
        warnings = sum(1 for r in self.records if r["status"] == "WARN")
        failed = sum(1 for r in self.records if r["status"] == "FAIL")

        rows = []
        for r in self.records:
            status_class = r["status"].lower()
            status_text = r["status"]
            sc_html = ""
            if r["screenshot"] and r["screenshot"].exists():
                sc_html = f'<a href="screenshots/{r["screenshot"].name}" target="_blank"><img src="screenshots/{r["screenshot"].name}" class="thumb" alt="Screenshot" /></a>'
            else:
                sc_html = '<span class="muted">-</span>'

            rows.append(f"""
            <tr class="{status_class}">
                <td><strong>{r['module']}</strong></td>
                <td>{r['test_name']}</td>
                <td><span class="badge {status_class}">{status_text}</span></td>
                <td>{r['duration']}s</td>
                <td>{sc_html}</td>
                <td><small>{r['note']}</small></td>
            </tr>
            """)

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{self.title}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; background: #F8FCF9; color: #0F172A; }}
        h1 {{ font-size: 24px; font-weight: 800; color: #0A2540; margin-bottom: 8px; }}
        .meta-bar {{ display: flex; gap: 24px; margin-bottom: 24px; padding: 16px; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; }}
        .metric {{ font-size: 14px; font-weight: 600; }}
        .metric span {{ font-weight: 800; }}
        .text-green {{ color: #0D7A5F; }}
        .text-red {{ color: #DC2626; }}
        table {{ width: 100%; border-collapse: collapse; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        th, td {{ padding: 14px 16px; text-align: left; border-bottom: 1px solid #F1F5F9; }}
        th {{ background: #F8FAFC; font-size: 12px; text-transform: uppercase; color: #64748B; font-weight: 700; }}
        .badge {{ display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; }}
        .badge.pass {{ background: #DCFCE7; color: #0D7A5F; }}
        .badge.warn {{ background: #FEF3C7; color: #D97706; }}
        .badge.fail {{ background: #FEE2E2; color: #DC2626; }}
        .thumb {{ width: 60px; height: 100px; object-fit: cover; border-radius: 6px; border: 1px solid #CBD5E1; transition: transform 0.2s; }}
        .thumb:hover {{ transform: scale(3); z-index: 100; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }}
        .muted {{ color: #94A3B8; }}
    </style>
</head>
<body>
    <h1>{self.title}</h1>
    <div class="meta-bar">
        <div class="metric">Total Tests: <span>{total}</span></div>
        <div class="metric text-green">Passed: <span>{passed}</span></div>
        <div class="metric text-red">Failed: <span>{failed}</span></div>
        <div class="metric">Total Time: <span>{total_time}s</span></div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Module</th>
                <th>Test Case</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Visual Capture</th>
                <th>Details</th>
            </tr>
        </thead>
        <tbody>
            {''.join(rows)}
        </tbody>
    </table>
</body>
</html>
"""
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(html_content)

        return out_file
