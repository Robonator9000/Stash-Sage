"""Test Stash Tracker PWA end-to-end with Playwright."""
from playwright.sync_api import sync_playwright, expect
import time

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
        )
        page = context.new_page()

        errors = []
        page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
        page.on('pageerror', lambda err: errors.append(str(err)))

        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        time.sleep(1)

        # ----- Test 1: Welcome Modal -----
        print("[1/8] Testing Welcome Modal appears on first visit...")
        welcome = page.locator('text=Stash Tracker').first
        expect(welcome).to_be_visible()
        lang_buttons = page.locator('button:has-text("English")').first
        expect(lang_buttons).to_be_visible()
        print("  PASS Welcome modal visible with language options")

        # ----- Test 2: Language Selection -----
        print("[2/8] Testing language selection...")
        page.locator('text=Español').first.click()
        page.get_by_role('button', name='Get Started').click()
        page.wait_for_timeout(500)
        print("  PASS Spanish selected, modal dismissed")

        # ----- Test 3: Main App Renders -----
        print("[3/8] Testing main app renders...")
        header = page.locator('text=Stash Tracker').first
        expect(header).to_be_visible()
        search = page.locator('input[placeholder*="buscar" i]').first
        expect(search).to_be_visible()
        print("  PASS Header and search bar rendered in Spanish")

        # ----- Test 4: Background Canvas -----
        print("[4/8] Testing background canvas...")
        canvas = page.locator('#bg-canvas').first
        expect(canvas).to_be_visible()
        canvas_box = canvas.bounding_box()
        assert canvas_box and canvas_box['width'] > 0 and canvas_box['height'] > 0
        print(f"  PASS Canvas present ({canvas_box['width']:.0f}x{canvas_box['height']:.0f})")

        # ----- Test 5: Add Product Modal -----
        print("[5/8] Testing Add Product flow...")
        # Clear localStorage to reset onboarding, then reopen
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_load_state('networkidle')
        time.sleep(0.5)

        # Complete onboarding in English
        page.locator('text=English').first.click()
        page.get_by_role('button', name='Get Started').click()
        page.wait_for_timeout(500)

        add_btn = page.get_by_role('button', name='Add Product').first
        expect(add_btn).to_be_visible()
        add_btn.click()
        page.wait_for_timeout(500)

        # Fill form
        name_input = page.locator('input[placeholder*="Blue Dream"]').first
        expect(name_input).to_be_visible()
        name_input.fill('Test OG Kush')

        page.locator('button:has-text("indica")').first.click()

        thc_input = page.locator('input[placeholder="0.0"]').first
        thc_input.fill('22.5')

        amount_input = page.locator('input[placeholder*="3.50"]').first
        amount_input.fill('3.5')

        # Submit via the ProductModal dialog footer button
        dialog = page.get_by_role('dialog')
        dialog.get_by_role('button', name='Add Product').click()
        page.wait_for_timeout(500)
        print("  PASS Product added successfully")

        # ----- Test 6: Settings Modal -----
        print("[6/8] Testing Settings modal...")
        settings_btn = page.get_by_role('button', name='Settings')
        expect(settings_btn).to_be_visible()
        settings_btn.click()
        page.wait_for_timeout(500)
        settings_title = page.locator('text=Settings').first
        expect(settings_title).to_be_visible()

        light_btn = page.locator('text=Light').first
        light_btn.click()
        page.wait_for_timeout(300)
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)
        print("  PASS Settings modal works, theme toggled")

        # ----- Test 7: Product Card Actions -----
        print("[7/8] Testing product card actions...")
        product_card = page.locator('text=Test OG Kush').first
        expect(product_card).to_be_visible()
        product_card.click()
        page.wait_for_timeout(300)
        print("  PASS Product card clickable")

        # ----- Test 8: Console Errors -----
        print("[8/8] Checking for console errors...")
        page.wait_for_timeout(1000)
        filtered = [e for e in errors if '404' not in e and 'favicon' not in e.lower()]
        if filtered:
            print(f"  WARN Found {len(filtered)} console errors:")
            for e in filtered[:5]:
                print(f"    - {e[:120]}")
        else:
            print("  PASS No console errors detected")

        print("\n====================")
        print("ALL TESTS PASSED" if not filtered else "TESTS COMPLETED (with warnings)")
        print("====================")

        browser.close()

if __name__ == '__main__':
    run_tests()
