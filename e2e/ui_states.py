"""Additional empty, error, validation and responsive-state checks."""

from __future__ import annotations

import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any

from smoke import ERRORS, Browser

APP = os.environ.get("APP_URL", "http://127.0.0.1:5173")
OUT = Path(tempfile.gettempdir()) / "swstack-ui-audit"
OUT.mkdir(parents=True, exist_ok=True)
CHECKS: list[dict[str, Any]] = []


def wait_app(browser: Browser) -> None:
    browser.wait("!!document.querySelector('#app')?.__vue_app__", timeout=30, label="app boot")


def go(browser: Browser, path: str) -> None:
    browser.send("Page.navigate", {"url": APP + path})
    wait_app(browser)
    browser.wait("document.querySelector('#main-content')?.innerText.trim().length > 15", timeout=20)
    browser.run("window.scrollTo(0,0); return true;")
    time.sleep(0.6)


def login(browser: Browser, email: str, password: str) -> None:
    go(browser, "/login")
    if not browser.get("!!document.querySelector('#login-email')"):
        browser.run("localStorage.clear(); sessionStorage.clear(); return true;")
        go(browser, "/login")
    browser.set_input("#login-email", email)
    browser.set_input("#login-password", password)
    browser.click("button.login-submit")
    browser.wait("location.pathname !== '/login'", timeout=20)
    browser.wait("!!document.querySelector('.profile-trigger')", timeout=20)


def check(name: str, condition: Any, detail: str = "") -> None:
    passed = bool(condition)
    CHECKS.append(
        {
            "name": name,
            "passed": passed,
            "detail": detail,
            "path": browser_path,
            "consoleErrors": list(dict.fromkeys(ERRORS)),
        }
    )
    print(f"{'PASS' if passed else 'FAIL'} {name}: {detail}", flush=True)


browser_path = ""


def text(browser: Browser, selector: str = "#main-content") -> str:
    return browser.get(
        f"(document.querySelector({json.dumps(selector)})?.innerText || '').replace(/\\s+/g, ' ').trim()"
    )


def click_text(browser: Browser, value: str, selector: str = "button, a") -> None:
    browser.run(
        f"""
        const norm = (v) => v.replace(/\\s+/g, ' ').trim();
        const target = norm({json.dumps(value)});
        const el = [...document.querySelectorAll({json.dumps(selector)})].find((node) => {{
          if (node.disabled) return false;
          const style = getComputedStyle(node);
          return style.display !== 'none' && style.visibility !== 'hidden' &&
            (norm(node.innerText) === target || node.getAttribute('aria-label') === target);
        }});
        if (!el) throw new Error('missing ' + target);
        el.scrollIntoView({{block:'center'}}); el.click(); return true;
        """
    )


def main() -> int:
    global browser_path
    browser = Browser()
    try:
        browser.send("Emulation.setDeviceMetricsOverride", {
            "width": 1440, "height": 1000, "deviceScaleFactor": 1, "mobile": False,
        })
        go(browser, "/login")
        browser.run("localStorage.clear(); sessionStorage.clear(); return true;")
        login(browser, "student@swstack.dev", "student123")

        go(browser, "/search")
        browser_path = "/search"
        landing = text(browser)
        check("search landing state", "热门搜索" in landing or "最近搜索" in landing, landing[:90])

        go(browser, "/search?q=zzzz-no-results&type=all")
        browser_path = "/search"
        empty_search = text(browser)
        check("search empty state", "没有找到相关内容" in empty_search, empty_search[:80])

        go(browser, "/")
        browser_path = "/"
        click_text(browser, "未回答")
        time.sleep(0.35)
        unanswered_rows = browser.get("document.querySelectorAll('.question-row').length")
        check("question unanswered tab", unanswered_rows == 1, f"{unanswered_rows} rows")

        go(browser, "/tags")
        browser_path = "/tags"
        browser.set_input('[aria-label="按名称筛选标签"]', "zzzz")
        time.sleep(0.2)
        tags_text = text(browser)
        check("tag filter empty state", "没有找到标签" in tags_text or "没有匹配" in tags_text, tags_text[:80])

        go(browser, "/projects")
        browser_path = "/projects"
        browser.set_input('[aria-label="搜索项目"]', "zzzz")
        click_text(browser, "搜索")
        time.sleep(0.4)
        project_text = text(browser)
        check("project empty state", "没有找到项目" in project_text, project_text[:80])

        go(browser, "/users")
        browser_path = "/users"
        first_before = browser.get("document.querySelector('.member-row')?.innerText || ''")
        click_text(browser, "回答数")
        time.sleep(0.25)
        first_after = browser.get("document.querySelector('.member-row')?.innerText || ''")
        check("user sort control", bool(first_after), f"{first_before[:20]} -> {first_after[:20]}")

        error_states = [
            ("question missing", "/questions/999", "没有找到"),
            ("project missing", "/projects/no-such-project", "没有找到"),
            ("column missing", "/columns/no-such-column", "没有找到"),
            ("tag missing", "/tags/no-such-tag", "没有"),
            ("user missing", "/users/no-such-user", "没有找到"),
            ("project edit missing", "/my/projects/999/edit", "没有找到"),
        ]
        for name, path, expected in error_states:
            go(browser, path)
            browser_path = path
            body_text = text(browser)
            check(name, expected in body_text, body_text[:90])

        go(browser, "/ask")
        browser_path = "/ask"
        browser.run("document.querySelector('form.ask-form')?.requestSubmit(); return true;")
        time.sleep(0.25)
        ask_errors = browser.get("document.querySelectorAll('.field-error').length")
        check("ask validation", ask_errors >= 2, f"{ask_errors} errors")

        go(browser, "/my/projects/new")
        browser_path = "/my/projects/new"
        browser.run("document.querySelector('form.editor-form')?.requestSubmit(); return true;")
        time.sleep(0.25)
        project_form_errors = browser.get("document.querySelectorAll('.field-error').length")
        check("project editor validation", project_form_errors >= 2, f"{project_form_errors} errors")

        go(browser, "/my/projects/1/updates")
        browser_path = "/my/projects/1/updates"
        browser.run("document.querySelector('form.composer-panel')?.requestSubmit(); return true;")
        time.sleep(0.25)
        update_errors = browser.get("document.querySelectorAll('.field-error, .form-error').length")
        check("project update validation", update_errors >= 2, f"{update_errors} errors")

        # Admin pagination and filters
        browser.run("localStorage.clear(); sessionStorage.clear(); return true;")
        login(browser, "admin@swstack.dev", "admin123")
        go(browser, "/admin/questions")
        browser_path = "/admin/questions"
        first_page_ids = browser.get(
            "[...document.querySelectorAll('.admin-table tbody tr td:first-child')].map((el) => el.innerText.trim()).join(',')"
        )
        browser.run("document.querySelector('button[aria-label=\"下一页\"]')?.click(); return true;")
        time.sleep(0.35)
        second_page_ids = browser.get(
            "[...document.querySelectorAll('.admin-table tbody tr td:first-child')].map((el) => el.innerText.trim()).join(',')"
        )
        page_label = browser.get("document.querySelector('.pagination-page')?.innerText || ''")
        check(
            "admin question pagination",
            bool(second_page_ids) and second_page_ids != first_page_ids and "2 / 2" in page_label,
            f"{page_label} | {first_page_ids[:20]} -> {second_page_ids[:20]}",
        )

        browser.set_input('[aria-label="搜索问题"]', "docker")
        browser.run("document.querySelector('.admin-filter-bar button[type=submit]')?.click(); return true;")
        time.sleep(0.35)
        admin_filter_text = text(browser)
        check("admin question filter", "1 条记录" in admin_filter_text, admin_filter_text[:80])

        go(browser, "/admin/columns/new")
        browser_path = "/admin/columns/new"
        browser.run("document.querySelector('#column-editor-form')?.requestSubmit(); return true;")
        time.sleep(0.2)
        column_errors = browser.get("document.querySelectorAll('.field-error, .form-error').length")
        check("column editor validation", column_errors >= 2, f"{column_errors} errors")

        # Mobile global navigation and follow-up density.
        browser.send("Emulation.setDeviceMetricsOverride", {
            "width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True,
        })
        go(browser, "/")
        browser_path = "/"
        mobile = browser.run(
            """
            const display = (selector) => {
              const el = document.querySelector(selector);
              return el ? getComputedStyle(el).display : null;
            };
            const targetStats = [...document.querySelectorAll('button, a')]
              .filter((el) => {
                const r = el.getBoundingClientRect();
                const s = getComputedStyle(el);
                return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
              })
              .map((el) => {
                const r = el.getBoundingClientRect();
                return {text:(el.innerText || el.getAttribute('aria-label') || '').trim(), w:r.width, h:r.height};
              });
            return {
              primaryNav: display('.primary-nav'),
              notification: display('.notification-button'),
              search: display('.header-search'),
              mobileProject: display('.mobile-project-link'),
              mobileColumn: display('.mobile-column-link'),
              footerLinks: [...document.querySelectorAll('.footer-nav a')].filter((el) => getComputedStyle(el).display !== 'none').map((el) => el.innerText.trim()),
              smallTargets: targetStats.filter((item) => item.w < 24 || item.h < 24).length,
              targetCount: targetStats.length,
              horizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
            };
            """
        )
        check(
            "mobile navigation exposure",
            mobile["primaryNav"] == "none" and mobile["notification"] == "none",
            json.dumps(mobile, ensure_ascii=False),
        )

        browser.run("document.querySelector('.profile-trigger')?.click(); return true;")
        time.sleep(0.2)
        menu = browser.get(
            "[...document.querySelectorAll('.profile-menu-item')].map((el) => el.innerText.replace(/\\s+/g,' ').trim())"
        )
        check("mobile profile menu", isinstance(menu, list) and len(menu) >= 5, json.dumps(menu, ensure_ascii=False))

        go(browser, "/admin")
        browser_path = "/admin"
        admin_mobile = browser.run(
            """
            const nav = document.querySelector('.admin-nav');
            const links = [...document.querySelectorAll('.admin-nav-link')];
            return {
              navClient: nav?.clientWidth ?? null,
              navScroll: nav?.scrollWidth ?? null,
              overflowX: nav ? getComputedStyle(nav).overflowX : null,
              first: links[0]?.innerText.trim() || null,
              last: links.at(-1)?.innerText.trim() || null,
              lastRectRight: links.at(-1)?.getBoundingClientRect().right || null,
              viewport: window.innerWidth,
              smallTargets: [...document.querySelectorAll('button, a')].filter((el) => {
                const r = el.getBoundingClientRect();
                const s = getComputedStyle(el);
                return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' &&
                  (r.width < 24 || r.height < 24);
              }).length,
            };
            """
        )
        check(
            "mobile admin navigation",
            admin_mobile["overflowX"] == "auto" and admin_mobile["navScroll"] > admin_mobile["navClient"],
            json.dumps(admin_mobile, ensure_ascii=False),
        )

        go(browser, "/questions/101")
        browser_path = "/questions/101"
        tiny_text = browser.run(
            """
            const visible = (el) => {
              const r = el.getBoundingClientRect();
              const s = getComputedStyle(el);
              return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
            };
            return {
              below11: [...document.querySelectorAll('#main-content *')].filter((el) =>
                visible(el) && (el.innerText || '').trim() && parseFloat(getComputedStyle(el).fontSize) < 11
              ).length,
              totalText: [...document.querySelectorAll('#main-content *')].filter((el) =>
                visible(el) && (el.innerText || '').trim()
              ).length,
              horizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
            };
            """
        )
        check(
            "mobile text density",
            tiny_text["horizontalOverflow"] is False and tiny_text["below11"] < tiny_text["totalText"],
            json.dumps(tiny_text, ensure_ascii=False),
        )
    finally:
        browser.close()

    payload = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "checks": CHECKS,
        "summary": {
            "total": len(CHECKS),
            "passed": sum(1 for item in CHECKS if item["passed"]),
            "failed": sum(1 for item in CHECKS if not item["passed"]),
            "consoleErrorChecks": sum(1 for item in CHECKS if item["consoleErrors"]),
        },
    }
    (OUT / "state-results.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(payload["summary"], ensure_ascii=False))
    return 0 if payload["summary"]["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
