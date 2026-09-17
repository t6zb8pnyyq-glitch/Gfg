from playwright.sync_api import sync_playwright
import os

def test_universe():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        file_url = f"file://{os.path.abspath('universe_creator.html')}"
        page.goto(file_url)
        page.wait_for_timeout(2000) # Wait for simulation to run a bit
        page.screenshot(path="/home/jules/verification/universe_initial_ko.png")

        # Click the Audit button
        try:
            page.click("button:has-text('시스템 구현 감사 (Audit)')")
            page.wait_for_timeout(500)
            page.screenshot(path="/home/jules/verification/universe_audit_ko.png")
        except Exception as e:
            print("Audit button not found or error: ", e)

        # Click the SPH Fluid tab
        try:
            page.click("button:has-text('SPH_FLUID')")
            page.wait_for_timeout(2000)
            page.screenshot(path="/home/jules/verification/universe_sph.png")
        except Exception as e:
            print("SPH tab not found or error: ", e)

        browser.close()

if __name__ == "__main__":
    test_universe()
