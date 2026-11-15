"""End-to-end smoke test: Vue dev server + real FastAPI backend.

Drives headless Chrome over CDP and exercises the core journeys the
minimum backend loop is supposed to support. Run from anywhere:

    python -I e2e/smoke.py

Requires:
  - backend on http://127.0.0.1:8000 (uv run uvicorn app.main:app --port 8000)
  - vite dev server on http://127.0.0.1:5173 with VITE_USE_MOCK=false
  - headless Chrome with --remote-debugging-port=9225
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time

import requests
import websocket

APP = os.environ.get("APP_URL", "http://127.0.0.1:5173")
CDP = os.environ.get("CDP_URL", "http://127.0.0.1:9225")
OUT = os.path.dirname(os.path.abspath(__file__))
CHECKS: list[tuple[str, bool, str]] = []
ERRORS: list[str] = []


def check(name: str, condition: object, detail: object = "") -> bool:
    ok = bool(condition)
    CHECKS.append((name, ok, str(detail)))
    print(("PASS  " if ok else "FAIL  ") + name + (("  | " + str(detail)) if detail else ""), flush=True)
    return ok


class Browser:
    def __init__(self) -> None:
        targets = requests.get(CDP + "/json", timeout=10).json()
        pages = [item for item in targets if item.get("type") == "page"]
        if not pages:
            raise RuntimeError("no CDP page target")
        page = next((item for item in pages if item.get("url", "").startswith(APP)), pages[0])
        self.ws = websocket.create_connection(
            page["webSocketDebuggerUrl"], suppress_origin=True, timeout=30
        )
        self.next_id = 0
        for method in ("Runtime.enable", "Page.enable", "Log.enable"):
            self.send(method)

    def send(self, method: str, params: dict | None = None) -> dict:
        self.next_id += 1
        message_id = self.next_id
        self.ws.send(json.dumps({"id": message_id, "method": method, "params": params or {}}))
        while True:
            message = json.loads(self.ws.recv())
            if message.get("id") == message_id:
                if "error" in message:
                    raise RuntimeError(f"{method}: {message['error']}")
                return message.get("result", {})
            self.handle_event(message)

    def handle_event(self, message: dict) -> None:
        method = message.get("method")
        params = message.get("params", {})
        if method == "Runtime.exceptionThrown":
            details = params.get("exceptionDetails", {})
            exception = details.get("exception", {})
            text = exception.get("description") or exception.get("value") or details.get("text")
            if text:
                ERRORS.append(f"exception: {text}")
        elif method == "Runtime.consoleAPICalled" and params.get("type") == "error":
            parts = [str(item.get("value") or item.get("description") or "") for item in params.get("args", [])]
            joined = " ".join(part for part in parts if part)
            if joined:
                ERRORS.append("console: " + joined)
        elif method == "Log.entryAdded":
            entry = params.get("entry", {})
            if entry.get("level") == "error":
                ERRORS.append("log: " + str(entry.get("text", "")))

    def evaluate(self, expression: str, await_promise: bool = False):
        result = self.send(
            "Runtime.evaluate",
            {
                "expression": expression,
                "awaitPromise": await_promise,
                "returnByValue": True,
                "userGesture": True,
            },
        )
        if "exceptionDetails" in result:
            details = result["exceptionDetails"]
            exception = details.get("exception", {})
            raise RuntimeError(exception.get("description") or details.get("text") or "eval failed")
        return result.get("result", {}).get("value")

    def run(self, body: str):
        return self.evaluate("(async () => { " + body + " })()", await_promise=True)

    def get(self, expression: str):
        return self.evaluate(expression)

    def wait(self, expression: str, timeout: float = 15.0, label: str | None = None) -> bool:
        deadline = time.time() + timeout
        last: Exception | None = None
        while time.time() < deadline:
            try:
                if self.get(expression):
                    return True
            except Exception as cause:  # noqa: BLE001
                last = cause
            time.sleep(0.15)
        raise RuntimeError(f"wait timeout: {label or expression} ({last})")

    def nav(self, path: str) -> str:
        self.send("Page.navigate", {"url": APP + path})
        self.wait(
            "location.pathname === " + json.dumps(path),
            timeout=30,
            label=f"path {path}",
        )
        self.wait(
            "!!document.querySelector('#app')?.__vue_app__",
            timeout=30,
            label="app boot",
        )
        time.sleep(0.3)
        return self.path()

    def path(self) -> str:
        return self.get("location.pathname")

    def text(self, selector: str = "body") -> str:
        return self.get(f"(document.querySelector({json.dumps(selector)})?.innerText || '')")

    def click(self, selector: str) -> bool:
        return self.run(
            f"const el = document.querySelector({json.dumps(selector)});"
            f"if (!el) throw new Error('missing selector: ' + {json.dumps(selector)});"
            "el.scrollIntoView({ block: 'center' });"
            "el.click();"
            "return true;"
        )

    def click_text(self, text: str, selector: str = "button, a") -> bool:
        body = f"""
        const norm = (v) => v.replace(/\\s+/g, ' ').trim();
        const target = norm({json.dumps(text)});
        const el = [...document.querySelectorAll({json.dumps(selector)})].find((node) => {{
          if (node.disabled) return false;
          const style = getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          return norm(node.innerText) === target || node.getAttribute('aria-label') === target;
        }});
        if (!el) throw new Error('missing text: ' + target);
        el.scrollIntoView({{ block: 'center' }});
        el.click();
        return true;
        """
        return self.run(body)

    def set_input(self, selector: str, value: str) -> str:
        body = f"""
        const el = document.querySelector({json.dumps(selector)});
        if (!el) throw new Error('missing input: ' + {json.dumps(selector)});
        const proto = el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, {json.dumps(value)});
        el.dispatchEvent(new Event('input', {{ bubbles: true }}));
        el.dispatchEvent(new Event('change', {{ bubbles: true }}));
        el.blur();
        return el.value;
        """
        return self.run(body)

    def api(self, module: str, export_name: str, method: str, args: list) -> dict:
        body = f"""
        const module = await import({json.dumps('/src/api/' + module + '.ts')});
        try {{
          const value = await module[{json.dumps(export_name)}][{json.dumps(method)}](...{json.dumps(args)});
          return {{ ok: true, value }};
        }} catch (error) {{
          return {{ ok: false, status: error.status ?? null, message: error.message ?? String(error) }};
        }}
        """
        return self.run(body)

    def screenshot(self, name: str) -> str:
        result = self.send("Page.captureScreenshot", {"format": "png"})
        path = os.path.join(OUT, name)
        with open(path, "wb") as handle:
            handle.write(base64.b64decode(result["data"]))
        return path

    def clear_storage(self) -> None:
        self.run("localStorage.clear(); sessionStorage.clear(); return true;")

    def close(self) -> None:
        self.ws.close()


def main() -> int:
    browser = Browser()
    try:
        if not browser.get("location.href.startsWith(" + json.dumps(APP) + ")"):
            browser.send("Page.navigate", {"url": APP})
            browser.wait(
                "!!document.querySelector('#app')?.__vue_app__",
                timeout=30,
                label="app boot",
            )
        browser.send("Network.clearBrowserCookies")
        browser.clear_storage()
        browser.send("Page.reload", {"ignoreCache": True})
        browser.wait(
            "!!document.querySelector('#app')?.__vue_app__",
            timeout=30,
            label="app reboot",
        )
        browser.nav("/login")
        browser.wait("!!document.querySelector('#login-email')", label="login form")
        check("guest can reach login", browser.path() == "/login", browser.path())

        browser.set_input("#login-email", "student@swstack.dev")
        browser.set_input("#login-password", "student123")
        browser.click("button.login-submit")
        browser.wait("!!document.querySelector('.profile-trigger')", label="session header")
        check("login with real backend", True, browser.path())
        # The pre-login session probe is expected to 401; only report errors from
        # the signed-in journeys below.
        ERRORS.clear()

        browser.nav("/")
        browser.wait("!!document.querySelector('.question-row')", label="question list")
        check("question list renders", "question-row" in browser.get("document.body.innerHTML"))

        first_title = browser.get("document.querySelector('.question-row')?.innerText.slice(0, 60)")
        browser.click(".question-row a, .question-row .item-title")
        browser.wait("!!document.querySelector('.vote-control')", label="question detail")
        check("open question detail", "/questions/" in browser.path(), browser.path())
        check("detail has seeded content", bool(first_title), first_title)

        score_before = browser.get(
            "Number(document.querySelector('.post-vote .vote-score')?.innerText || 0)"
        )
        browser.click(".post-vote .vote-button.up")
        browser.wait(
            f"Number(document.querySelector('.post-vote .vote-score')?.innerText || 0) === {score_before + 1}",
            label="vote increments",
        )
        check("vote persists to backend", True, score_before)

        browser.click(".post-vote .bookmark-button")
        browser.wait("!!document.querySelector('.post-vote .bookmark-button.active')", label="bookmark active")
        check("bookmark persists to backend", True)

        browser.set_input(".answer-textarea", "来自真实后端的最小闭环验证回答, 用于确认写接口可用并且可以回读.")
        browser.click_text("发布回答")
        browser.wait("!!document.querySelector('.answer-item')", label="answer created")
        check("answer created", True)

        browser.nav("/users/suhe")
        browser.wait("!!document.querySelector('.profile-trigger')", label="profile header")
        browser.wait("!!document.body.innerText.includes('苏禾')", label="profile loaded")
        check("user profile loads", True)

        browser.nav("/users/zhouqi")
        browser.wait("!!document.body.innerText.includes('周其')", label="target profile")
        follow = browser.api("follows", "followApi", "toggleUser", ["zhouqi"])
        check("follow user via api", follow.get("ok"), follow.get("message", ""))
        unfollow = browser.api("follows", "followApi", "toggleUser", ["zhouqi"])
        check("unfollow user via api", unfollow.get("ok"), unfollow.get("message", ""))

        browser.nav("/following")
        browser.wait("!!document.querySelector('.following-list')", label="following feed")
        check("following feed loads", True)

        browser.nav("/tags/vue3")
        browser.wait("!!document.body.innerText.includes('vue3')", label="tag detail")
        tag_follow = browser.api("follows", "followApi", "toggleTag", ["vue3"])
        check("follow tag via api", tag_follow.get("ok"), tag_follow.get("message", ""))

        search = browser.api("search", "searchApi", "search", [{"q": "vue", "type": "all"}])
        check("search returns results", search.get("ok") and search["value"]["total"] > 0, search.get("message", ""))
        suggest = browser.api("search", "searchApi", "suggest", ["vue", 5])
        check("suggest returns items", suggest.get("ok") and len(suggest["value"]["items"]) > 0)
        trending = browser.api("search", "searchApi", "trending", [])
        check("trending returns terms", trending.get("ok") and len(trending["value"]) > 0)

        browser.nav("/ask")
        browser.wait("!!document.querySelector('#question-title')", label="ask form")
        browser.set_input("#question-title", "真实后端联调: 提问接口是否可用")
        browser.set_input(
            "#question-body",
            "这是一条通过浏览器提交的问题, 用于确认真实 FastAPI 后端的创建接口和列表回读都正常.",
        )
        browser.set_input("#tag-input", "vue3")
        browser.run(
            "const el = document.querySelector('#tag-input');"
            "el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));"
            "return true;"
        )
        browser.click("button.publish-button")
        browser.wait("location.pathname.startsWith('/questions/')", timeout=20, label="question created")
        check("create question", True, browser.path())

        browser.screenshot("smoke-question-detail.png")
        browser.nav("/")
        browser.wait("!!document.querySelector('.question-row')", label="question list again")
        check(
            "created question appears in list",
            "真实后端联调" in browser.get("document.body.innerText"),
        )
        browser.screenshot("smoke-question-list.png")
    finally:
        browser.close()

    print("\n--- checks ---")
    for name, ok, detail in CHECKS:
        print(("PASS " if ok else "FAIL ") + name)
    if ERRORS:
        print("\n--- console/runtime errors ---")
        for error in ERRORS:
            print(error)
    failed = [name for name, ok, _ in CHECKS if not ok]
    print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} checks passed, {len(ERRORS)} runtime errors")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
