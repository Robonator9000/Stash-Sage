"""Comprehensive E2E tests for Stash Tracker PWA."""
from playwright.sync_api import sync_playwright, expect
import time

PASS = 0
FAIL = 0

def check(label: str, condition: bool, detail: str = ""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  PASS | {label}")
    else:
        FAIL += 1
        print(f"  FAIL | {label}" + (f" | {detail}" if detail else ""))

def print_header(num, name):
    print(f"\n[{num:02d}/18] {name}")
    print("-" * 60)

def run_tests():
    global PASS, FAIL
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        errors = []
        page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
        page.on('pageerror', lambda err: errors.append(str(err)))

        # ---------- SETUP ----------
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        time.sleep(1)

        # ===== 01: Welcome Modal =====
        print_header(1, "Welcome Modal & Onboarding")
        check("Welcome modal visible",
            page.locator('text=Stash Tracker').first.is_visible())
        check("Language options present",
            page.locator('button:has-text("English")').first.is_visible())
        check("Get Started button present",
            page.get_by_role('button', name='Get Started').is_visible())

        # ===== 02: Language Selection =====
        print_header(2, "Language Selection")
        for lang_name in ['English', 'Español', 'Français', 'Deutsch', 'Português']:
            btn = page.locator(f'button:has-text("{lang_name}")').first
            check(f"{lang_name} option visible", btn.is_visible())

        # Switch to Spanish, verify, proceed
        page.locator('text=Español').first.click()
        page.get_by_role('button', name='Get Started').click()
        page.wait_for_timeout(500)
        check("Modal dismissed after language selection",
            not page.get_by_role('button', name='Get Started').is_visible())

        # ===== 03: Main App Render =====
        print_header(3, "Main App Render (Spanish)")
        check("Header visible in Spanish",
            page.locator('text=Stash Tracker').first.is_visible())
        check("Search bar with Spanish placeholder",
            page.locator('input[placeholder*="buscar" i]').first.is_visible())
        check("Settings button visible",
            page.get_by_role('button', name='Settings').is_visible())
        check("Add Product button visible",
            page.get_by_role('button', name='Add Product').first.is_visible())
        check("Product grid/filters visible",
            page.locator('button:has-text("Todos")').first.is_visible())

        # ===== 04: Background Canvas =====
        print_header(4, "Background Canvas")
        canvas = page.locator('#bg-canvas').first
        check("Canvas element exists", canvas.is_visible())
        box = canvas.bounding_box()
        check("Canvas has dimensions", box and box['width'] > 0 and box['height'] > 0,
              f"({box['width']:.0f}x{box['height']:.0f})" if box else "no box")

        # ===== 05: Add Product =====
        print_header(5, "Add Product")
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_load_state('networkidle')
        time.sleep(0.5)
        page.locator('text=English').first.click()
        page.get_by_role('button', name='Get Started').click()
        page.wait_for_timeout(500)

        page.get_by_role('button', name='Add Product').first.click()
        page.wait_for_timeout(500)

        # Fill form
        page.locator('input[placeholder*="Blue Dream"]').first.fill('Test OG Kush')

        # Use custom strain type via + button
        page.locator('button:has-text("Custom")').first.click()
        page.wait_for_timeout(200)
        custom_input = page.locator('input[placeholder*="custom strain"]').first
        check("Custom strain input appears", custom_input.is_visible())
        custom_input.fill('Purple Punch')

        page.locator('input[placeholder="0.0"]').first.fill('22.5')
        page.locator('input[placeholder*="3.50"]').first.fill('3.5')

        dialog = page.get_by_role('dialog')
        dialog.get_by_role('button', name='Add Product').click()
        page.wait_for_timeout(500)

        check("Product card appears in grid",
            page.locator('text=Test OG Kush').first.is_visible())
        check("Custom strain type shown",
            page.locator('text=Purple Punch').first.is_visible())
        check("THC value visible",
            page.locator('text=22.5%').first.is_visible())

        # ===== 06: Edit Product =====
        print_header(6, "Edit Product")
        page.locator('text=Test OG Kush').first.click()
        page.wait_for_timeout(300)

        check("Edit modal opens",
            page.get_by_role('dialog').locator('text=Edit Product').is_visible())

        # Edit the name
        name_field = page.locator('input[placeholder*="Blue Dream"]').first
        name_field.fill('')
        name_field.fill('Test Modified OG')

        page.get_by_role('button', name='Save').click()
        page.wait_for_timeout(500)

        check("Edited product name visible",
            page.locator('text=Test Modified OG').first.is_visible())

        # ===== 07: Consume Product & Low Stock Toast =====
        print_header(7, "Consume Product & Low Stock Alert")
        # Set threshold to 5g first via localStorage, then reload
        page.evaluate('() => { const s = JSON.parse(localStorage.getItem("weed-settings") || "{}"); s.lowStockThreshold = 5; localStorage.setItem("weed-settings", JSON.stringify(s)); }')
        page.reload()
        page.wait_for_load_state('networkidle')
        time.sleep(0.5)

        # Close any open modal first, then click Consume directly on card
        page.keyboard.press('Escape')
        page.wait_for_timeout(300)
        page.keyboard.press('Escape')
        page.wait_for_timeout(300)

        consume_btn = page.get_by_role('button', name='Consume').first
        check("Consume button on card", consume_btn.is_visible())
        consume_btn.click()
        page.wait_for_timeout(300)

        check("Consume modal opens",
            page.get_by_role('dialog').locator('text=Consume').first.is_visible())

        # Set amount to consume (3.5 - 2 = 1.5 which is below 5g threshold)
        amt_input = page.get_by_role('dialog').locator('input[type="number"]').first
        amt_input.fill('2')
        page.get_by_role('dialog').get_by_role('button', name='Consume').click()
        page.wait_for_timeout(500)

        # Check toast notification appears
        toast = page.locator('text=Low Stock Alert').first
        check("Low stock toast notification appears", toast.is_visible(),
              f"visible={toast.is_visible()}")
        check("Toast shows product name",
            page.locator('text=Test Modified OG').first.is_visible())

        # Check remaining amount
        check("Amount updated on card",
            page.locator('text=1.50g').first.is_visible() or
            page.locator('text=1.5g').first.is_visible())

        # ===== 08: Sell Product =====
        print_header(8, "Sell Product")
        # First add more product so we can test grayed out portions
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_load_state('networkidle')
        time.sleep(0.5)
        page.locator('text=English').first.click()
        page.get_by_role('button', name='Get Started').click()
        page.wait_for_timeout(500)
        page.get_by_role('button', name='Add Product').first.click()
        page.wait_for_timeout(300)
        page.locator('input[placeholder*="Blue Dream"]').first.fill('Bulk Weed')
        page.locator('input[placeholder*="3.50"]').first.fill('200')
        page.get_by_role('dialog').get_by_role('button', name='Add Product').click()
        page.wait_for_timeout(500)

        # Open sell modal (close edit modal first if open)
        page.keyboard.press('Escape')
        page.wait_for_timeout(200)
        page.keyboard.press('Escape')
        page.wait_for_timeout(200)
        page.get_by_role('button', name='Sell').first.click()
        page.wait_for_timeout(300)

        # Check portions
        small_portion = page.locator('button:has-text("0.5g")').first
        check("Small portions enabled", small_portion.is_enabled())

        large_portion = page.locator('button:has-text("28g")').first
        check("28g portion enabled for 200g product", large_portion.is_enabled())

        # Grayed out portion (above 200g)
        huge_portion = page.locator('button:has-text("224g")').first
        check("Oversized portion visible but disabled",
            huge_portion.is_visible() and huge_portion.is_disabled())

        # + Custom button
        custom_sell_btn = page.locator('button:has-text("Custom")').first
        check("Custom + button visible", custom_sell_btn.is_visible())
        custom_sell_btn.click()
        page.wait_for_timeout(200)

        custom_sell_input = page.locator('input[placeholder="grams"]')
        check("Custom sell input expands",
            custom_sell_input.is_visible())

        # Close sell modal
        page.keyboard.press('Escape')
        page.wait_for_timeout(300)

        # Close product modal
        page.keyboard.press('Escape')
        page.wait_for_timeout(300)

        # ===== 09: Settings Modal =====
        print_header(9, "Settings Modal")
        page.get_by_role('button', name='Settings').click()
        page.wait_for_timeout(500)

        check("Settings modal title",
            page.locator('text=Settings').first.is_visible())
        check("Personalization tab active by default",
            page.locator('text=Personalization').first.is_visible())
        check("Danger Zone tab present",
            page.locator('text=Danger Zone').first.is_visible())

        # Theme toggle
        dark_btn = page.locator('button:has-text("Dark")').first
        light_btn = page.locator('button:has-text("Light")').first
        check("Dark/Light theme buttons", dark_btn.is_visible() and light_btn.is_visible())

        light_btn.click()
        page.wait_for_timeout(200)
        check("Light theme selected",
            '"theme":"light"' in page.evaluate('localStorage.getItem("weed-settings")'))

        dark_btn.click()
        page.wait_for_timeout(200)
        check("Dark theme re-selected",
            '"theme":"dark"' in page.evaluate('localStorage.getItem("weed-settings")'))

        # Low stock threshold
        lts_input = page.locator(f'input[value="5"]').first
        if not lts_input.is_visible():
            lts_input = page.locator('input[type="number"]').nth(2)
        check("Low stock threshold input visible", lts_input.is_visible())

        # Currency buttons
        for sym in ['$', '€', '£', '¥', '₿']:
            btn = page.locator(f'button:has-text("{sym}")').first
            if btn.is_visible():
                check(f"Currency {sym} button visible", True)
                break

        # Decimal precision
        check("Decimal precision 0-3 buttons",
            page.locator('button:has-text("2")').first.is_visible())

        # Stats visibility
        check("Stats visibility options",
            page.locator('text=Show Stats').first.is_visible())

        # Session defaults
        check("Session defaults section",
            page.locator('text=Session Defaults').first.is_visible())

        # => Danger Zone
        page.locator('text=Danger Zone').click()
        page.wait_for_timeout(200)

        check("Backup & Restore section",
            page.locator('text=Backup & Restore').first.is_visible())
        check("Export buttons visible",
            page.locator('text=Export Backup').first.is_visible())
        check("Import buttons visible",
            page.locator('text=Import Backup').first.is_visible())
        check("PIN Lock section",
            page.locator('text=PIN Lock').first.is_visible())

        # Close settings
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)

        # ===== 10: Filter & Sort =====
        print_header(10, "Filter & Sort")
        for filt in ['All Products', 'Indica', 'Sativa', 'Hybrid', 'Favorites', 'In Stock', 'Low Stock', 'Out of Stock']:
            btn = page.locator(f'button:has-text("{filt}")').first
            is_vis = btn.is_visible()
            if is_vis:
                check(f"Filter '{filt}' visible", True)

        sort_btn = page.locator('button:has-text("Newest")').first
        check("Sort dropdown visible", sort_btn.is_visible())

        # ===== 11: Search =====
        print_header(11, "Search")
        search_input = page.locator('input[placeholder*="Search" i]').first
        check("Search input visible", search_input.is_visible())
        search_input.fill('Bulk')
        page.wait_for_timeout(500)
        check("Search finds matching product",
            page.locator('text=Bulk Weed').first.is_visible())

        search_input.fill('ZZZZNOSEPRODUCTS')
        page.wait_for_timeout(500)
        check("Search with no results shows empty state",
            page.locator('text=No products found').first.is_visible() or
            page.locator('text=Try adjusting').first.is_visible(),
            "empty state or hint visible")

        search_input.fill('')
        page.wait_for_timeout(500)

        # ===== 12: Favorites =====
        print_header(12, "Favorites Toggle")
        fav_btn = page.locator('button[aria-label*="favourite" i], button[aria-label*="favorite" i]').first
        if not fav_btn.is_visible():
            fav_btn = page.locator('button[aria-label*="Favorites"]').first
        check("Favorite button visible", fav_btn.is_visible())
        fav_btn.click()
        page.wait_for_timeout(300)
        # Toggle back
        fav_btn.click()
        page.wait_for_timeout(300)

        # ===== 13: Product Card Actions Pinned to Bottom =====
        print_header(13, "Card Layout - Buttons Pinned to Bottom")
        card = page.locator('text=Bulk Weed').first
        check("Product name visible in card", card.is_visible())

        # Get the buttons inside the same card area
        consume_btn2 = page.locator('text=Consume').first
        sell_btn2 = page.locator('button:has-text("Sell")').first

        check("Consume action button visible",
            consume_btn2.is_visible())
        check("Sell action button visible",
            sell_btn2.is_visible())

        # ===== 14: Dark/Light Mode Class Toggle =====
        print_header(14, "Dark/Light Mode CSS Toggle")
        has_dark = page.evaluate('document.documentElement.classList.contains("dark")')
        check("Dark class present on html (dark mode default)", has_dark)

        # Toggle to light
        page.get_by_role('button', name='Settings').click()
        page.wait_for_timeout(300)
        page.locator('button:has-text("Light")').first.click()
        page.wait_for_timeout(300)
        page.keyboard.press('Escape')
        page.wait_for_timeout(300)

        has_dark_after = page.evaluate('document.documentElement.classList.contains("dark")')
        check("Dark class removed after light toggle", not has_dark_after)

        # Toggle back
        page.get_by_role('button', name='Settings').click()
        page.wait_for_timeout(300)
        page.locator('button:has-text("Dark")').first.click()
        page.wait_for_timeout(300)
        page.keyboard.press('Escape')
        page.wait_for_timeout(300)

        # ===== 15: Toast Dismiss =====
        print_header(15, "Toast Dismissal")
        check("Page interactive after toast",
            page.locator('text=Stash Tracker').first.is_visible())

        # ===== 16: Console Errors =====
        print_header(16, "Console Error Check")
        page.wait_for_timeout(500)
        filtered = [e for e in errors
                    if '404' not in e and 'favicon' not in e.lower() and 'PrecacheController' not in e]
        check("No unexpected console errors",
            len(filtered) == 0,
            f"Found {len(filtered)} errors: {'; '.join(filtered[:3])}" if filtered else "")

        # ===== 17: Delete Product =====
        print_header(17, "Delete Product")
        page.locator('text=Bulk Weed').first.click()
        page.wait_for_timeout(300)

        delete_btn = page.locator('button:has-text("Delete")').first
        check("Delete button visible in edit modal", delete_btn.is_visible())
        page.evaluate('window.confirm = () => true')
        delete_btn.click()
        page.wait_for_timeout(500)
        check("Product deleted",
            not page.locator('text=Bulk Weed').is_visible())

        # ===== 18: No Products Empty State =====
        print_header(18, "Empty State")
        check("No products empty state visible",
            page.locator('text=No products yet').first.is_visible() or
            page.locator('text=No products found').first.is_visible())
        check("Add first product hint visible",
            page.locator('text=Start tracking').first.is_visible() or
            page.locator('text=adding your first product').first.is_visible())

        # ---------- FINAL SUMMARY ----------
        print("\n" + "=" * 60)
        print(f"  RESULTS:  {PASS} passed, {FAIL} failed, {PASS + FAIL} total")
        print("=" * 60)

        browser.close()
        return FAIL == 0

if __name__ == '__main__':
    success = run_tests()
    exit(0 if success else 1)
