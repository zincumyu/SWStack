"""Verify that project filtering and user sorting change rendered results."""

from __future__ import annotations

import time

from smoke import Browser
from ui_audit import go, login


def main() -> int:
    browser = Browser()
    try:
        browser.send(
            "Emulation.setDeviceMetricsOverride",
            {"width": 1440, "height": 1000, "deviceScaleFactor": 1, "mobile": False},
        )
        go(browser, "/login")
        browser.run("localStorage.clear(); sessionStorage.clear(); return true;")
        login(browser, "student@swstack.dev", "student123")

        go(browser, "/projects")
        before = browser.get(
            "[...document.querySelectorAll('.project-card')].map((x) => x.innerText.split('\\n')[0]).join('|')"
        )
        browser.run(
            "const s=document.querySelector('.project-select');"
            "s.value='building'; s.dispatchEvent(new Event('change',{bubbles:true})); return true;"
        )
        time.sleep(0.5)
        after = browser.get(
            "[...document.querySelectorAll('.project-card')].map((x) => x.innerText.split('\\n')[0]).join('|')"
        )
        print("PROJECT_BEFORE", before)
        print("PROJECT_AFTER ", after)
        print("PROJECT_CHANGED", before != after)

        go(browser, "/users")
        users_before = browser.get(
            "[...document.querySelectorAll('.member-row .member-name')].map((x) => x.innerText).join('|')"
        )
        browser.run(
            "const t=[...document.querySelectorAll('.view-tab')].find((x)=>x.innerText.trim()==='新加入');"
            "if(!t) return false; t.click(); return true;"
        )
        time.sleep(0.3)
        users_after = browser.get(
            "[...document.querySelectorAll('.member-row .member-name')].map((x) => x.innerText).join('|')"
        )
        print("USERS_BEFORE", users_before)
        print("USERS_AFTER ", users_after)
        print("USERS_CHANGED", users_before != users_after)
    finally:
        browser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
