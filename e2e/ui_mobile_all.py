"""Mobile-only sweep of all authenticated SWStack routes."""

from __future__ import annotations

import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any

from smoke import ERRORS, Browser
from ui_audit import (
    APP,
    OUT,
    RESULTS,
    SHOTS,
    go,
    login,
    make_contact_sheet,
    snapshot,
)


def check_path(browser: Browser, expected: str, name: str) -> None:
    if browser.path() != expected:
        RESULTS[-1]["pathMismatch"] = True
        RESULTS[-1]["expectedPath"] = expected
        print(f"PATH MISMATCH {name}: {browser.path()} != {expected}", flush=True)


def main() -> int:
    browser = Browser()
    try:
        browser.send("Emulation.setDeviceMetricsOverride", {
            "width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True,
        })
        go(browser, "/login")
        browser.run("localStorage.clear(); sessionStorage.clear(); return true;")
        login(browser, "student@swstack.dev", "student123")

        student_routes = [
            ("questions", "/", "/"),
            ("search", "/search?q=vue&type=all", "/search"),
            ("question-detail", "/questions/101", "/questions/101"),
            ("tags", "/tags", "/tags"),
            ("tag-detail", "/tags/vue3", "/tags/vue3"),
            ("projects", "/projects", "/projects"),
            ("project-detail", "/projects/campus-flow", "/projects/campus-flow"),
            ("columns", "/columns", "/columns"),
            ("column-detail", "/columns/vue3-engineering-path", "/columns/vue3-engineering-path"),
            ("users", "/users", "/users"),
            ("user-profile", "/users/suhe", "/users/suhe"),
            ("ask", "/ask", "/ask"),
            ("following", "/following", "/following"),
            ("notifications", "/notifications", "/notifications"),
            ("my-projects", "/my/projects", "/my/projects"),
            ("project-new", "/my/projects/new", "/my/projects/new"),
            ("project-edit", "/my/projects/1/edit", "/my/projects/1/edit"),
            ("project-applications", "/my/projects/1/applications", "/my/projects/1/applications"),
            ("project-updates", "/my/projects/1/updates", "/my/projects/1/updates"),
            ("welcome", "/welcome", "/welcome"),
            ("my-columns-denied", "/my/columns", "/columns"),
            ("not-found", "/route-that-does-not-exist", "/route-that-does-not-exist"),
        ]
        for name, path, expected in student_routes:
            snapshot(browser, "mobile-student", name, path)
            check_path(browser, expected, name)

        browser.run("localStorage.clear(); sessionStorage.clear(); return true;")
        login(browser, "admin@swstack.dev", "admin123")
        admin_routes = [
            ("admin-dashboard", "/admin", "/admin"),
            ("admin-questions", "/admin/questions", "/admin/questions"),
            ("admin-projects", "/admin/projects", "/admin/projects"),
            ("admin-project-review", "/admin/projects/1/review", "/admin/projects/1/review"),
            ("admin-project-updates", "/admin/projects/1/updates", "/admin/projects/1/updates"),
            ("admin-columns", "/admin/columns", "/admin/columns"),
            ("admin-column-new", "/admin/columns/new", "/admin/columns/new"),
            ("admin-column-edit", "/admin/columns/1/edit", "/admin/columns/1/edit"),
            ("admin-users", "/admin/users", "/admin/users"),
            ("admin-tags", "/admin/tags", "/admin/tags"),
            ("my-columns", "/my/columns", "/my/columns"),
            ("my-column-new", "/my/columns/new", "/my/columns/new"),
            ("my-column-edit", "/my/columns/1/edit", "/my/columns/1/edit"),
        ]
        for name, path, expected in admin_routes:
            snapshot(browser, "mobile-admin", name, path)
            check_path(browser, expected, name)
            # Detect internal horizontal scroll containers and clipped tables.
            extra = browser.run(
                """
                return [...document.querySelectorAll('#main-content *')]
                  .filter((el) => {
                    const style = getComputedStyle(el);
                    return el.scrollWidth > el.clientWidth + 4 &&
                      ['auto', 'scroll'].includes(style.overflowX) &&
                      el.getBoundingClientRect().width > 0;
                  })
                  .slice(0, 6)
                  .map((el) => ({
                    tag: el.tagName,
                    className: String(el.className || '').slice(0, 70),
                    clientWidth: el.clientWidth,
                    scrollWidth: el.scrollWidth,
                  }));
                """
            )
            RESULTS[-1]["internalScrollContainers"] = extra

        browser.send("Emulation.setDeviceMetricsOverride", {
            "width": 320, "height": 700, "deviceScaleFactor": 1, "mobile": True,
        })
        go(browser, "/")
        narrow = browser.run(
            """
            return {
              path: location.pathname,
              bodyScrollWidth: document.body.scrollWidth,
              viewportWidth: window.innerWidth,
              overflow: document.body.scrollWidth > window.innerWidth + 1,
              headerHeight: document.querySelector('.site-header')?.getBoundingClientRect().height,
              questionCount: document.querySelectorAll('.question-row').length,
            };
            """
        )
        RESULTS.append({
            "role": "mobile-320",
            "name": "questions-narrow",
            "requestedPath": "/",
            "actualPath": browser.path(),
            **narrow,
            "consoleErrors": list(dict.fromkeys(ERRORS)),
        })
        print("mobile-320 narrow", narrow, flush=True)

    finally:
        browser.close()

    pages = [row for row in RESULTS if row.get("screenshot")]
    summary = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "pages": len(pages),
        "pathMismatch": sum(1 for row in pages if row.get("pathMismatch")),
        "consoleErrorPages": sum(1 for row in pages if row.get("consoleErrors")),
        "horizontalOverflowPages": sum(1 for row in pages if row.get("horizontalOverflow")),
        "internalScrollPages": [
            {"role": row["role"], "name": row["name"], "containers": row.get("internalScrollContainers", [])}
            for row in pages if row.get("internalScrollContainers")
        ],
        "smallTargetPages": sum(1 for row in pages if row.get("smallTargetCount", 0) > 0),
        "narrow320": next((row for row in RESULTS if row["role"] == "mobile-320"), None),
    }
    (OUT / "mobile-results.json").write_text(
        json.dumps({"summary": summary, "pages": RESULTS}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    mobile_items = [row for row in RESULTS if row.get("screenshot") and row["role"] == "mobile-student"]
    make_contact_sheet(mobile_items, OUT / "mobile-student-contact.png", cols=5, width=210)
    admin_items = [row for row in RESULTS if row.get("screenshot") and row["role"] == "mobile-admin"]
    make_contact_sheet(admin_items, OUT / "mobile-admin-contact.png", cols=5, width=210)
    print(json.dumps(summary, ensure_ascii=False))
    return 0 if summary["pathMismatch"] == 0 and summary["consoleErrorPages"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
