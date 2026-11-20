# Browser audit scripts

Standalone Chrome DevTools Protocol scripts used for the UI audit in
`../UI_AUDIT_REPORT.md`. They are not part of the CI pipeline: each one
needs a running app and a headless Chrome with remote debugging enabled.

## Requirements

```bash
python -m pip install requests websocket-client pillow
```

```bash
# app, mock mode by default
cd .. && npm run dev -- --port 5173
# or against the real backend: VITE_USE_MOCK=false npm run dev

# headless Chrome with a dedicated debugging port
chrome --headless --remote-debugging-port=9225 --user-data-dir=%TEMP%/swstack-cdp
```

## Usage

Run from this directory so `smoke.py` resolves as a local module.

| Script                | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| `smoke.py`            | Core journeys against the real FastAPI backend            |
| `ui_audit.py`         | Screenshots, layout metrics and overflow checks per route |
| `ui_a11y.py`          | Accessibility inventory: landmarks, headings, labels      |
| `ui_mobile_all.py`    | Mobile sweep of every authenticated route                 |
| `ui_states.py`        | Empty, error, validation and responsive states            |
| `ui_check_filters.py` | Verifies filters and sorting actually change results      |

```bash
cd e2e
python -I smoke.py
```

`APP_URL` and `CDP_URL` override the defaults (`http://127.0.0.1:5173` and
`http://127.0.0.1:9225`). Results are written to the OS temp directory, not
into the repository.

The scripts sign in with the seeded demo accounts documented in
`../server/README.md`. They assume mock mode unless `VITE_USE_MOCK=false`.
