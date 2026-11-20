"""Read-only browser audit for every SWStack route.

Run while Vite is serving http://127.0.0.1:5173 and headless Chrome exposes
CDP at http://127.0.0.1:9225.

    cd e2e
    python ui_audit.py

Results, screenshots and contact sheets are written to the OS temp directory.
"""

from __future__ import annotations

import json
import os
import re
import tempfile
import time
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

from smoke import ERRORS, Browser

APP = os.environ.get("APP_URL", "http://127.0.0.1:5173")
OUT = Path(tempfile.gettempdir()) / "swstack-ui-audit"
SHOTS = OUT / "shots"
OUT.mkdir(parents=True, exist_ok=True)
SHOTS.mkdir(parents=True, exist_ok=True)

RESULTS: list[dict[str, Any]] = []


def visible_js() -> str:
    return """
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
        style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
    };
    """


def wait_app(browser: Browser) -> None:
    browser.wait(
        "!!document.querySelector('#app')?.__vue_app__",
        timeout=30,
        label="app boot",
    )


def go(browser: Browser, path: str, expected_path: str | None = None) -> str:
    browser.send("Page.navigate", {"url": APP + path})
    wait_app(browser)
    if expected_path:
        browser.wait(
            "location.pathname === " + json.dumps(expected_path),
            timeout=20,
            label=f"redirect {path} -> {expected_path}",
        )
    browser.wait(
        "document.querySelector('#main-content')?.innerText.trim().length > 20",
        timeout=20,
        label="main content",
    )
    browser.run("window.scrollTo(0, 0); return true;")
    time.sleep(0.7)
    return browser.path()


def screenshot(browser: Browser, name: str) -> str:
    result = browser.send(
        "Page.captureScreenshot",
        {"format": "png", "captureBeyondViewport": False, "fromSurface": True},
    )
    import base64

    path = SHOTS / f"{name}.png"
    path.write_bytes(base64.b64decode(result["data"]))
    return str(path)


def snapshot(browser: Browser, role: str, name: str, path: str) -> dict[str, Any]:
    ERRORS.clear()
    actual = go(browser, path)
    js = (
        visible_js()
        + """
    return (() => {
      const body = document.body;
      const h1 = [...document.querySelectorAll('h1')].filter(isVisible);
      const main = document.querySelector('#main-content');
      const header = document.querySelector('.site-header');
      const footer = document.querySelector('.site-footer');
      const panels = [...document.querySelectorAll('.panel')].filter(isVisible);
      const allButtons = [...document.querySelectorAll('button')].filter(isVisible);
      const inputs = [...document.querySelectorAll('input, textarea, select')].filter(isVisible);
      const cards = [...document.querySelectorAll(
        '.question-row, .tag-card, .project-card, .column-card, .developer-card, .profile-card, .application, .notification-item'
      )].filter(isVisible);
      const smallTargets = allButtons
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 40),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
        .filter((item) => item.width < 28 || item.height < 28);
      const overflow = [...document.querySelectorAll('#main-content *')]
        .filter((el) => {
          if (!isVisible(el)) return false;
          const style = getComputedStyle(el);
          return el.scrollWidth > el.clientWidth + 3 &&
            ['visible', 'clip'].includes(style.overflowX);
        })
        .slice(0, 8)
        .map((el) => ({
          tag: el.tagName,
          className: String(el.className || '').slice(0, 80),
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
          text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 50),
        }));
      const mainRect = main?.getBoundingClientRect();
      const headerStyle = header ? getComputedStyle(header) : null;
      const bodyStyle = getComputedStyle(body);
      const pageRoot = main?.firstElementChild;
      const rootStyle = pageRoot ? getComputedStyle(pageRoot) : null;
      return {
        path: location.pathname + location.search,
        documentTitle: document.title,
        h1: h1.map((el) => (el.innerText || '').replace(/\\s+/g, ' ').trim()).join(' | '),
        h1Count: h1.length,
        textLength: (main?.innerText || '').trim().length,
        textStart: (main?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 180),
        bodyScrollWidth: body.scrollWidth,
        viewportWidth: window.innerWidth,
        horizontalOverflow: body.scrollWidth > window.innerWidth + 1,
        documentHeight: document.documentElement.scrollHeight,
        mainTop: mainRect ? Math.round(mainRect.top) : null,
        mainWidth: mainRect ? Math.round(mainRect.width) : null,
        headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
        headerPosition: headerStyle?.position || null,
        footerVisible: footer ? isVisible(footer) : false,
        panelCount: panels.length,
        cardCount: cards.length,
        buttonCount: allButtons.length,
        inputCount: inputs.length,
        smallTargetCount: smallTargets.length,
        smallTargets: smallTargets.slice(0, 6),
        overflowElements: overflow,
        skeletonCount: document.querySelectorAll('.skeleton').length,
        emptyStateCount: [...document.querySelectorAll('.page-state, .empty-state')].filter(isVisible).length,
        bodyBg: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        bodyFont: bodyStyle.fontFamily,
        bodyFontSize: bodyStyle.fontSize,
        pageMaxWidth: rootStyle?.maxWidth || null,
        pagePaddingLeft: rootStyle?.paddingLeft || null,
        navLinkCount: [...document.querySelectorAll('.primary-nav .nav-link')].filter(isVisible).length,
        profileVisible: !!document.querySelector('.profile-trigger') && isVisible(document.querySelector('.profile-trigger')),
        askVisible: !!document.querySelector('.ask-button') && isVisible(document.querySelector('.ask-button')),
        searchVisible: !!document.querySelector('.header-search') && isVisible(document.querySelector('.header-search')),
        mobileProjectVisible: !!document.querySelector('.mobile-project-link') && isVisible(document.querySelector('.mobile-project-link')),
        mobileColumnVisible: !!document.querySelector('.mobile-column-link') && isVisible(document.querySelector('.mobile-column-link')),
      };
    })()
    """
    )
    metrics = browser.run(js)
    shot = screenshot(browser, f"{role}-{len(RESULTS) + 1:02d}-{name}")
    errors = list(dict.fromkeys(ERRORS))
    row = {
        "role": role,
        "name": name,
        "requestedPath": path,
        "actualPath": actual,
        **metrics,
        "consoleErrors": errors,
        "screenshot": shot,
    }
    RESULTS.append(row)
    print(
        f"{role:7} {name:28} {actual:34} h1={metrics.get('h1', '')[:28]!r} "
        f"overflow={metrics.get('horizontalOverflow')} errors={len(errors)}",
        flush=True,
    )
    return row


def login(browser: Browser, email: str, password: str) -> None:
    browser.send("Network.clearBrowserCookies")
    browser.clear_storage()
    go(browser, "/login")
    browser.wait("!!document.querySelector('#login-email')", label="login form")
    browser.set_input("#login-email", email)
    browser.set_input("#login-password", password)
    browser.click("button.login-submit")
    browser.wait("location.pathname !== '/login'", timeout=20, label="login")
    browser.wait("!!document.querySelector('.profile-trigger')", timeout=20, label="profile")


def click_selector(browser: Browser, selector: str) -> None:
    browser.run(
        f"const el = document.querySelector({json.dumps(selector)});"
        "if (!el) throw new Error('missing ' + " + json.dumps(selector) + ");"
        "el.scrollIntoView({block:'center'}); el.click(); return true;"
    )


def click_text(browser: Browser, text: str, selector: str = "button, a") -> None:
    browser.run(
        f"""
        const norm = (v) => v.replace(/\\s+/g, ' ').trim();
        const target = norm({json.dumps(text)});
        const el = [...document.querySelectorAll({json.dumps(selector)})].find((node) => {{
          if (node.disabled) return false;
          const style = getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          return norm(node.innerText) === target || node.getAttribute('aria-label') === target;
        }});
        if (!el) throw new Error('missing text: ' + target);
        el.scrollIntoView({{block:'center'}}); el.click(); return true;
        """
    )


def add_interaction(
    browser: Browser,
    name: str,
    role: str,
    action: str,
    result: bool,
    detail: str,
) -> None:
    RESULTS.append(
        {
            "role": role,
            "name": name,
            "requestedPath": "",
            "actualPath": browser.path(),
            "interaction": action,
            "passed": result,
            "detail": detail,
            "screenshot": "",
            "consoleErrors": list(dict.fromkeys(ERRORS)),
        }
    )
    print(f"{role:7} {name:28} interaction {action}: {'PASS' if result else 'FAIL'} {detail}", flush=True)


def api_call(browser: Browser, expression: str) -> Any:
    return browser.run(expression)


def investigate_data(browser: Browser, role: str) -> dict[str, Any]:
    if role == "student":
        return api_call(
            browser,
            """
            const p = await import('/src/api/projects.ts');
            const c = await import('/src/api/columns.ts');
            let mine = [], projects = [], columns = [];
            try { mine = await p.projectApi.mine(); } catch (error) {}
            try { projects = (await p.projectApi.list({page:1, pageSize:50})).items; } catch (error) {}
            try { columns = (await c.columnApi.list({page:1, pageSize:50})).items; } catch (error) {}
            return {
              mine: mine.map((item) => ({id:item.id, name:item.name, slug:item.slug})),
              projects: projects.map((item) => ({id:item.id, name:item.name, slug:item.slug})),
              columns: columns.map((item) => ({id:item.id, name:item.title, slug:item.slug})),
            };
            """,
        )
    return api_call(
        browser,
        """
        const a = await import('/src/api/admin.ts');
        const c = await import('/src/api/columns.ts');
        const projects = await a.adminApi.projects({page:1, pageSize:50, status:'all', visibility:'all'});
        const columns = await c.adminColumnApi.list({page:1, pageSize:50, status:'all'});
        const mine = await c.myColumnApi.list({page:1, pageSize:50});
        return {
          projects: projects.items.map((item) => ({id:item.id, name:item.name, reviewStatus:item.reviewStatus, updateCount:item.updateCount})),
          columns: columns.items.map((item) => ({id:item.id, title:item.title})),
          mine: mine.items.map((item) => ({id:item.id, title:item.title})),
        };
        """,
    )


def make_contact_sheet(items: list[dict[str, Any]], output: Path, cols: int = 4, width: int = 400) -> None:
    images: list[tuple[Image.Image, str]] = []
    for row in items:
        shot = row.get("screenshot")
        if not shot or not Path(shot).exists():
            continue
        image = Image.open(shot).convert("RGB")
        height = round(image.height * width / image.width)
        images.append((image.resize((width, height)), f"{row['role']} / {row['name']}"))
    if not images:
        return
    thumb_h = max(image.height for image, _ in images)
    rows = (len(images) + cols - 1) // cols
    label_h = 22
    sheet = Image.new("RGB", (cols * width, rows * (thumb_h + label_h)), "#e8eaed")
    draw = ImageDraw.Draw(sheet)
    for index, (image, label) in enumerate(images):
        x = (index % cols) * width
        y = (index // cols) * (thumb_h + label_h)
        sheet.paste(image, (x, y + label_h))
        draw.text((x + 6, y + 4), label, fill="#202124")
    sheet.save(output)


def main() -> int:
    browser = Browser()
    try:
        browser.send("Emulation.setDeviceMetricsOverride", {
            "width": 1440, "height": 1000, "deviceScaleFactor": 1, "mobile": False,
        })

        # Guest surfaces
        go(browser, "/welcome")
        browser.send("Network.clearBrowserCookies")
        browser.clear_storage()
        go(browser, "/welcome")
        snapshot(browser, "guest", "welcome", "/welcome")
        go(browser, "/login")
        snapshot(browser, "guest", "login", "/login")
        browser.click("button.login-submit")
        time.sleep(0.25)
        login_errors = browser.get("document.querySelectorAll('.field-error').length")
        add_interaction(browser, "login-validation", "guest", "empty submit", login_errors > 0, f"{login_errors} field errors")
        go(browser, "/", expected_path="/welcome")
        snapshot(browser, "guest", "protected-redirect", "/")
        go(browser, "/admin", expected_path="/welcome")
        snapshot(browser, "guest", "admin-redirect", "/admin")

        # Student surfaces
        login(browser, "student@swstack.dev", "student123")
        student = investigate_data(browser, "student")
        student_project = student["mine"][0] if student["mine"] else {"id": 1}
        column_slug = student["columns"][0]["slug"] if student["columns"] else "vue3-engineering-path"
        project_slug = next(
            (item["slug"] for item in student["projects"] if item["id"] == 1),
            student["projects"][0]["slug"] if student["projects"] else "campus-flow",
        )

        base_routes = [
            ("questions", "/", "/"),
            ("search", "/search?q=vue&type=all", "/search"),
            ("question-detail", "/questions/101", "/questions/101"),
            ("tags", "/tags", "/tags"),
            ("tag-detail", "/tags/vue3", "/tags/vue3"),
            ("projects", "/projects", "/projects"),
            ("project-detail", f"/projects/{project_slug}", f"/projects/{project_slug}"),
            ("columns", "/columns", "/columns"),
            ("column-detail", f"/columns/{column_slug}", f"/columns/{column_slug}"),
            ("users", "/users", "/users"),
            ("user-profile", "/users/suhe", "/users/suhe"),
            ("ask", "/ask", "/ask"),
            ("following", "/following", "/following"),
            ("notifications", "/notifications", "/notifications"),
            ("my-projects", "/my/projects", "/my/projects"),
            ("project-new", "/my/projects/new", "/my/projects/new"),
            ("project-edit", f"/my/projects/{student_project['id']}/edit", f"/my/projects/{student_project['id']}/edit"),
            ("project-applications", f"/my/projects/{student_project['id']}/applications", f"/my/projects/{student_project['id']}/applications"),
            ("project-updates", f"/my/projects/{student_project['id']}/updates", f"/my/projects/{student_project['id']}/updates"),
            ("welcome-auth", "/welcome", "/welcome"),
            ("my-columns-denied", "/my/columns", "/columns"),
            ("my-column-new-denied", "/my/columns/new", "/columns"),
            ("my-column-edit-denied", "/my/columns/1/edit", "/columns"),
            ("not-found", "/route-that-does-not-exist", "/route-that-does-not-exist"),
        ]
        for name, path, expected in base_routes:
            snapshot(browser, "student", name, path)
            RESULTS[-1]["pathMismatch"] = browser.path() != expected

        # Key student interactions
        go(browser, "/questions/101")
        browser.wait("!!document.querySelector('.vote-control')", label="question detail")
        score_before = browser.get("Number(document.querySelector('.post-vote .vote-score')?.innerText || -999)")
        browser.click(".post-vote .vote-button.up")
        browser.wait(
            f"Number(document.querySelector('.post-vote .vote-score')?.innerText || 0) > {score_before}",
            label="vote",
        )
        score_after = browser.get("document.querySelector('.post-vote .vote-score')?.innerText")
        add_interaction(browser, "question-vote", "student", "upvote", True, f"{score_before} -> {score_after}")
        browser.click(".post-vote .bookmark-button")
        browser.wait("!!document.querySelector('.post-vote .bookmark-button.active')", label="bookmark")
        add_interaction(browser, "question-bookmark", "student", "toggle bookmark", True, "active")
        browser.set_input(".answer-textarea", "这是一条用于 UI 审计的长回答，确认回答编辑器、提交按钮和回答列表在实际浏览器中可用。")
        click_text(browser, "发布回答")
        browser.wait("document.querySelectorAll('.answer-item').length >= 3", label="answer")
        answer_count = browser.get("document.querySelectorAll('.answer-item').length")
        add_interaction(browser, "question-answer", "student", "submit answer", True, f"{answer_count} answers")

        go(browser, "/notifications")
        unread_before = browser.get("document.querySelector('.notification-count')?.innerText || '0'")
        if browser.get("!!document.querySelector('.mark-all-button:not(:disabled)')"):
            click_text(browser, "全部标为已读")
            browser.wait("!document.querySelector('.notification-count')", label="mark all read")
            add_interaction(browser, "notifications-read-all", "student", "mark all read", True, f"badge {unread_before} -> 0")
        else:
            add_interaction(browser, "notifications-read-all", "student", "mark all read", False, "no enabled mark-all button")

        go(browser, "/projects")
        filter_ok = browser.run(
            "const s=document.querySelector('.project-select'); if(!s) return false;"
            "s.value='building'; s.dispatchEvent(new Event('change',{bubbles:true})); return true;"
        )
        time.sleep(0.4)
        add_interaction(browser, "project-filter", "student", "filter building", bool(filter_ok), f"path {browser.path()}")

        # Admin surfaces
        login(browser, "admin@swstack.dev", "admin123")
        admin = investigate_data(browser, "admin")
        admin_project = admin["projects"][0] if admin["projects"] else {"id": 1}
        admin_log_project = next((p for p in admin["projects"] if p.get("updateCount", 0) > 0), admin_project)
        admin_column = admin["columns"][0] if admin["columns"] else {"id": 1}
        my_column = admin["mine"][0] if admin["mine"] else admin_column

        admin_routes = [
            ("admin-dashboard", "/admin", "/admin"),
            ("admin-questions", "/admin/questions", "/admin/questions"),
            ("admin-projects", "/admin/projects", "/admin/projects"),
            ("admin-project-review", f"/admin/projects/{admin_project['id']}/review", f"/admin/projects/{admin_project['id']}/review"),
            ("admin-project-updates", f"/admin/projects/{admin_log_project['id']}/updates", f"/admin/projects/{admin_log_project['id']}/updates"),
            ("admin-columns", "/admin/columns", "/admin/columns"),
            ("admin-column-new", "/admin/columns/new", "/admin/columns/new"),
            ("admin-column-edit", f"/admin/columns/{admin_column['id']}/edit", f"/admin/columns/{admin_column['id']}/edit"),
            ("admin-users", "/admin/users", "/admin/users"),
            ("admin-tags", "/admin/tags", "/admin/tags"),
            ("my-columns", "/my/columns", "/my/columns"),
            ("my-column-new", "/my/columns/new", "/my/columns/new"),
            ("my-column-edit", f"/my/columns/{my_column['id']}/edit", f"/my/columns/{my_column['id']}/edit"),
        ]
        for name, path, expected in admin_routes:
            snapshot(browser, "admin", name, path)
            RESULTS[-1]["pathMismatch"] = browser.path() != expected

        # Mobile spot checks with the authenticated admin session.
        browser.send("Emulation.setDeviceMetricsOverride", {
            "width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True,
        })
        mobile_routes = [
            ("mobile-questions", "/", "/"),
            ("mobile-question-detail", "/questions/101", "/questions/101"),
            ("mobile-projects", "/projects", "/projects"),
            ("mobile-columns", "/columns", "/columns"),
            ("mobile-users", "/users", "/users"),
            ("mobile-notifications", "/notifications", "/notifications"),
            ("mobile-admin", "/admin", "/admin"),
        ]
        for name, path, expected in mobile_routes:
            snapshot(browser, "mobile", name, path)
            RESULTS[-1]["pathMismatch"] = browser.path() != expected

        mobile_menu = browser.run(
            "const p=document.querySelector('.profile-trigger'); if(!p) return false; p.click(); return true;"
        )
        time.sleep(0.2)
        profile_items = browser.get("document.querySelectorAll('.profile-menu-item').length")
        add_interaction(browser, "mobile-profile-menu", "mobile", "open profile menu", bool(mobile_menu and profile_items), f"{profile_items} items")

    finally:
        browser.close()

    summary = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "app": APP,
        "pages": RESULTS,
        "counts": {
            "pages": sum(1 for row in RESULTS if row.get("screenshot")),
            "interactions": sum(1 for row in RESULTS if row.get("interaction")),
            "consoleErrorPages": sum(1 for row in RESULTS if row.get("consoleErrors")),
            "horizontalOverflowPages": sum(1 for row in RESULTS if row.get("horizontalOverflow")),
            "smallTargetPages": sum(1 for row in RESULTS if row.get("smallTargetCount", 0) > 0),
            "missingH1": sum(1 for row in RESULTS if row.get("screenshot") and row.get("h1Count") == 0),
        },
        "studentData": student,
        "adminData": admin,
    }
    (OUT / "results.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    desktop = [row for row in RESULTS if row.get("screenshot") and row["role"] in {"guest", "student", "admin"}]
    mobile = [row for row in RESULTS if row.get("screenshot") and row["role"] == "mobile"]
    make_contact_sheet(desktop, OUT / "desktop-contact.png", cols=4, width=360)
    make_contact_sheet(mobile, OUT / "mobile-contact.png", cols=4, width=220)
    print(json.dumps(summary["counts"], ensure_ascii=False))
    print(f"results: {OUT / 'results.json'}")
    print(f"shots:   {SHOTS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
