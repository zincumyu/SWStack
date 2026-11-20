"""Lightweight accessibility inventory for every audited route."""

from __future__ import annotations

import json
import os
import tempfile
import time
from pathlib import Path

from smoke import ERRORS, Browser
from ui_audit import APP, OUT, go, login

RESULTS_FILE = OUT / "results.json"


def audit_page(browser: Browser) -> dict:
    return browser.run(
        """
        const visible = (el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
        };
        const nameOf = (el) => [
          el.innerText,
          el.getAttribute('aria-label'),
          el.getAttribute('title'),
          el.getAttribute('alt'),
        ].filter(Boolean).join(' ').replace(/\\s+/g, ' ').trim();
        const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
        const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
        const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
          .filter(visible)
          .map((el) => Number(el.tagName[1]));
        let skips = 0;
        for (let i = 1; i < headings.length; i += 1) {
          if (headings[i] > headings[i - 1] + 1) skips += 1;
        }
        const images = [...document.querySelectorAll('img')].filter(visible);
        const buttons = [...document.querySelectorAll('button')].filter(visible);
        const links = [...document.querySelectorAll('a')].filter(visible);
        const inputs = [...document.querySelectorAll('input,textarea,select')].filter(visible);
        return {
          lang: document.documentElement.lang || null,
          title: document.title,
          mainCount: document.querySelectorAll('main').length,
          h1Count: document.querySelectorAll('h1').length,
          visibleH1Count: [...document.querySelectorAll('h1')].filter(visible).length,
          headingSkips: skips,
          duplicateIds,
          images: images.length,
          imagesMissingAltAttr: images.filter((el) => !el.hasAttribute('alt')).length,
          emptyAltImages: images.filter((el) => el.getAttribute('alt') === '').length,
          buttons: buttons.length,
          unnamedButtons: buttons.filter((el) => !nameOf(el)).length,
          links: links.length,
          unnamedLinks: links.filter((el) => !nameOf(el)).length,
          inputs: inputs.length,
          unlabeledInputs: inputs.filter((el) => {
            if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
            if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return false;
            if (el.closest('label')) return false;
            return true;
          }).length,
          positiveTabindex: [...document.querySelectorAll('[tabindex]')]
            .filter((el) => Number(el.getAttribute('tabindex')) > 0).length,
          skipLink: !!document.querySelector('.skip-link'),
          footerNavLabel: document.querySelector('.footer-nav')?.getAttribute('aria-label') || null,
        };
        """
    )


def main() -> int:
    data = json.loads(RESULTS_FILE.read_text(encoding="utf-8"))
    student_paths = [
        row["actualPath"]
        for row in data["pages"]
        if row.get("screenshot") and row["role"] == "student"
    ]
    admin_paths = [
        row["actualPath"]
        for row in data["pages"]
        if row.get("screenshot") and row["role"] == "admin"
    ]
    browser = Browser()
    findings: list[dict] = []
    try:
        browser.send("Emulation.setDeviceMetricsOverride", {
            "width": 1440, "height": 1000, "deviceScaleFactor": 1, "mobile": False,
        })
        go(browser, "/login")
        browser.run("localStorage.clear(); sessionStorage.clear(); return true;")
        login(browser, "student@swstack.dev", "student123")
        for path in dict.fromkeys(student_paths):
            ERRORS.clear()
            go(browser, path)
            row = {
                "role": "student",
                "path": path,
                **audit_page(browser),
                "consoleErrors": list(dict.fromkeys(ERRORS)),
            }
            findings.append(row)

        browser.run("localStorage.clear(); sessionStorage.clear(); return true;")
        login(browser, "admin@swstack.dev", "admin123")
        for path in dict.fromkeys(admin_paths):
            ERRORS.clear()
            go(browser, path)
            row = {
                "role": "admin",
                "path": path,
                **audit_page(browser),
                "consoleErrors": list(dict.fromkeys(ERRORS)),
            }
            findings.append(row)
    finally:
        browser.close()

    summary = {
        "pages": len(findings),
        "missingLang": [f["path"] for f in findings if not f["lang"]],
        "unexpectedMainCount": [{"path": f["path"], "count": f["mainCount"]} for f in findings if f["mainCount"] != 1],
        "h1Issues": [{"path": f["path"], "h1": f["h1Count"]} for f in findings if f["h1Count"] != 1],
        "headingSkips": [{"path": f["path"], "skips": f["headingSkips"]} for f in findings if f["headingSkips"]],
        "duplicateIds": [{"path": f["path"], "ids": f["duplicateIds"]} for f in findings if f["duplicateIds"]],
        "imageIssues": [{"path": f["path"], "missingAlt": f["imagesMissingAltAttr"]} for f in findings if f["imagesMissingAltAttr"]],
        "unnamedButtons": [{"path": f["path"], "count": f["unnamedButtons"]} for f in findings if f["unnamedButtons"]],
        "unnamedLinks": [{"path": f["path"], "count": f["unnamedLinks"]} for f in findings if f["unnamedLinks"]],
        "unlabeledInputs": [{"path": f["path"], "count": f["unlabeledInputs"]} for f in findings if f["unlabeledInputs"]],
        "positiveTabindex": [{"path": f["path"], "count": f["positiveTabindex"]} for f in findings if f["positiveTabindex"]],
        "missingSkipLink": [f["path"] for f in findings if not f["skipLink"]],
        "consoleErrors": [{"path": f["path"], "errors": f["consoleErrors"]} for f in findings if f["consoleErrors"]],
    }
    (OUT / "a11y-results.json").write_text(
        json.dumps({"summary": summary, "pages": findings}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
