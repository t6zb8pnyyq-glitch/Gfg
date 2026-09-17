from playwright.sync_api import sync_playwright
import os

def test_universe():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"Browser console: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser error: {err}"))

        file_url = f"file://{os.path.abspath('universe_creator.html')}"
        page.goto(file_url)
        page.wait_for_timeout(1000)

        # Click the Audit button
        print("Clicking audit button...")
        page.click("button:has-text('시스템 구현 감사 (Audit)')")
        page.wait_for_timeout(500)

        browser.close()

if __name__ == "__main__":
    test_universe()
