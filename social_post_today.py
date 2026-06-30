from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import random

W, H = 1080, 1920
img = Image.new('RGBA', (W, H))
draw = ImageDraw.Draw(img)

# Electric palette
NEON_PINK = (255, 20, 147)
HOT_PINK = (255, 105, 180)
ELECTRIC_PURPLE = (138, 43, 226)
DEEP_PURPLE = (48, 0, 96)
NEON_CYAN = (0, 255, 255)
GOLD = (255, 215, 0)
WHITE = (255, 255, 255)
DARK = (10, 5, 20)
WARM_ORANGE = (255, 140, 0)
LIME = (180, 255, 20)

fonts_dir = r"C:\Users\msuse\.claude\skills\canvas-design\canvas-fonts"

# --- Background: dark purple radial gradient ---
for y in range(H):
    for x in range(0, W, 2):
        dx = x - W/2
        dy = y - H/2
        dist = math.sqrt(dx*dx + dy*dy)
        max_dist = math.sqrt((W/2)**2 + (H/2)**2)
        t = min(dist / max_dist, 1.0)
        r = int(15 + t * 110)
        g = int(2 + t * 10)
        b = int(40 + t * 170)
        draw.point((x, y), fill=(r, g, b, 255))
        if x + 1 < W:
            draw.point((x+1, y), fill=(r, g, b, 255))

# --- Radial light burst from top-center ---
burst = Image.new('RGBA', (W, H), (0, 0, 0, 0))
bdraw = ImageDraw.Draw(burst)
rays = 20
for i in range(rays):
    angle_start = (i / rays) * 180 - 90
    angle_end = ((i + 0.35) / rays) * 180 - 90
    cx, cy = W // 2, -50
    r_len = int(H * 1.5)
    pts = [(cx, cy)]
    for a10 in range(int(angle_start * 10), int(angle_end * 10) + 1):
        angle = math.radians(a10 / 10)
        pts.append((cx + r_len * math.cos(angle), cy + r_len * math.sin(angle)))
    pts.append((cx, cy))
    alpha = 15 if i % 2 == 0 else 8
    bdraw.polygon(pts, fill=(255, 255, 255, alpha))
burst_blurred = burst.filter(ImageFilter.GaussianBlur(radius=40))
img = Image.alpha_composite(img, burst_blurred)
draw = ImageDraw.Draw(img)

# --- Bokeh orbs ---
overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
odraw = ImageDraw.Draw(overlay)
random.seed(77)
orb_colors = [
    (255, 20, 147, 30), (138, 43, 226, 25), (0, 255, 255, 20),
    (255, 215, 0, 20), (255, 140, 0, 25), (180, 255, 20, 15),
]
for _ in range(30):
    cx = random.randint(-80, W + 80)
    cy = random.randint(-80, H + 80)
    rad = random.randint(60, 200)
    color = random.choice(orb_colors)
    odraw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=color)
overlay_blurred = overlay.filter(ImageFilter.GaussianBlur(radius=70))
img = Image.alpha_composite(img, overlay_blurred)
draw = ImageDraw.Draw(img)

# --- Top accent bar ---
draw.rectangle([(0, 0), (W, 6)], fill=(*NEON_PINK, 230))

# --- Star sparks ---
def draw_spark(d, cx, cy, size, color, alpha=200):
    pts = []
    for i in range(8):
        angle = math.radians(i * 45 - 90)
        r = size if i % 2 == 0 else size * 0.25
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    d.polygon(pts, fill=(*color, alpha))

sparkles = [
    (90, 160, 16), (980, 140, 12), (160, 1000, 14), (920, 950, 18),
    (540, 100, 9), (60, 600, 13), (1020, 550, 11), (250, 1300, 15),
    (780, 1350, 11), (480, 1600, 13), (700, 280, 8), (380, 220, 10),
    (850, 450, 9), (200, 800, 12), (540, 1700, 8), (300, 1500, 10),
]
for sx, sy, ss in sparkles:
    draw_spark(draw, sx, sy, ss, WHITE, 180)

# --- Fonts ---
font_huge = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 220)
font_big = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 88)
font_med = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 60)
font_sm = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 48)
font_reg = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Regular.ttf", 38)
font_pill = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Bold.ttf", 30)
font_pill_sm = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Bold.ttf", 26)
font_bold_it = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Bold.ttf", 42)
font_url = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Bold.ttf", 36)
font_small = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Bold.ttf", 34)

# --- "TODAY" ribbon ---
ribbon_y = 60
ribbon_h = 68
# Neon glow behind ribbon
for offset in range(14, 0, -2):
    glow_alpha = int(45 - offset * 3)
    draw.rounded_rectangle(
        [(100 - offset, ribbon_y - offset//2), (W - 100 + offset, ribbon_y + ribbon_h + offset//2)],
        radius=34, fill=(*NEON_PINK, max(glow_alpha, 5))
    )
draw.rounded_rectangle([(100, ribbon_y), (W - 100, ribbon_y + ribbon_h)],
                       radius=34, fill=(*NEON_PINK, 245))
bbox = draw.textbbox((0, 0), "TODAY", font=font_sm)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, ribbon_y + 7), "TODAY", fill=WHITE, font=font_sm)

# --- "24" with shadow ---
num_text = "24"
bbox_num = draw.textbbox((0, 0), num_text, font=font_huge)
nw = bbox_num[2] - bbox_num[0]
# Neon glow behind number
for glow_r in range(50, 0, -5):
    glow_alpha = int(18 - glow_r // 4)
    draw.text(((W - nw) // 2, 165), num_text, fill=(255, 20, 147, max(glow_alpha, 2)), font=font_huge)
# Shadow
draw.text(((W - nw) // 2 + 5, 172), num_text, fill=(0, 0, 0, 80), font=font_huge)
# Main text
draw.text(((W - nw) // 2, 165), num_text, fill=WHITE, font=font_huge)

# --- "NEW EXOTIC FLAVORS" ---
sub_text = "NEW EXOTIC FLAVORS"
bbox_sub = draw.textbbox((0, 0), sub_text, font=font_big)
sw = bbox_sub[2] - bbox_sub[0]
draw.text(((W - sw) // 2, 410), sub_text, fill=(*GOLD, 240), font=font_big)

# --- "AVAILABLE NOW" tag ---
avail_text = "AVAILABLE NOW"
bbox_a = draw.textbbox((0, 0), avail_text, font=font_small)
aw = bbox_a[2] - bbox_a[0]
avail_y = 520
draw.rounded_rectangle([(W//2 - aw//2 - 28, avail_y - 4), (W//2 + aw//2 + 28, avail_y + 48)],
                       radius=24, fill=(*NEON_CYAN, 80), outline=(*NEON_CYAN, 200), width=2)
draw.text(((W - aw) // 2, avail_y + 5), avail_text, fill=(*WHITE, 255), font=font_small)

# --- Flavor pills (2 columns) ---
all_rows = [
    ["Apple Candy", "Apricot Jelly"],
    ["Banana Daze", "Banana Kush"],
    ["Bloodshot", "Blueberry Oatmeal"],
    ["Blueberry Pie", "Champagne"],
    ["Mint Chocolate", "Clementine Ice"],
    ["Frosted Grapes", "Golden Mango"],
    ["Grand Daddy Purple", "Green Crack"],
    ["Irish Cream", "Maple Pumpkin Pie"],
    ["Pink Flamingo", "Red Berry Punch"],
    ["Rootbeer", "Sour Watermelon"],
    ["Tangie", "Watermelon"],
    ["Cherry Jam", "Galactic Grape"],
]

pill_colors = [HOT_PINK, (0, 160, 190), ELECTRIC_PURPLE, (57, 255, 20),
               WARM_ORANGE, NEON_PINK, GOLD, LIME]
pill_h = 52
pill_gap_x = 16
pill_gap_y = 14
start_y = 590
col_width = (W - 100 - pill_gap_x) // 2

for ri, row in enumerate(all_rows):
    sy = start_y + ri * (pill_h + pill_gap_y)
    sx_left = 50
    sx_right = 50 + col_width + pill_gap_x

    for ci, fname in enumerate(row):
        f = font_pill_sm if len(fname) > 16 else font_pill
        bbox = draw.textbbox((0, 0), fname.upper(), font=f)
        pw = bbox[2] - bbox[0] + 32
        sx = sx_left if ci == 0 else sx_right
        px = sx + (col_width - pw) // 2

        color = pill_colors[(ri * 2 + ci) % len(pill_colors)]
        draw.rounded_rectangle(
            [(px, sy), (px + pw, sy + pill_h)],
            radius=pill_h // 2,
            fill=(*color, 190)
        )
        bbox = draw.textbbox((0, 0), fname.upper(), font=f)
        tw = bbox[2] - bbox[0]
        draw.text((px + (pw - tw) // 2, sy + 10), fname.upper(), fill=(*WHITE, 245), font=f)

# --- Price pill (after pills end: 590 + 12*(52+14) = 1362) ---
price_y = 1400
price_box_w = 260
price_font = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Bold.ttf", 42)
# Glow
for offset in range(10, 0, -2):
    draw.rounded_rectangle(
        [(W//2 - price_box_w - offset, price_y - offset//2),
         (W//2 + price_box_w + offset, price_y + 72 + offset//2)],
        radius=38, fill=(*GOLD, max(18 - offset * 2, 3))
    )
draw.rounded_rectangle([(W//2 - price_box_w, price_y), (W//2 + price_box_w, price_y + 72)],
                       radius=36, fill=(*DARK, 230), outline=(*GOLD, 100), width=2)
price_text = "$15 CARTS  ·  $30 DISPOS"
bbox_p = draw.textbbox((0, 0), price_text, font=price_font)
pw = bbox_p[2] - bbox_p[0]
draw.text(((W - pw) // 2, price_y + 12), price_text, fill=(*GOLD, 240), font=price_font)

# --- CTA button ---
cta_y = 1530
cta_font = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 56)
# Glow
for offset in range(12, 0, -2):
    draw.rounded_rectangle(
        [(W//2 - 320 - offset, cta_y - offset//2),
         (W//2 + 320 + offset, cta_y + 80 + offset//2)],
        radius=42, fill=(*NEON_PINK, max(35 - offset * 3, 5))
    )
draw.rounded_rectangle([(W//2 - 320, cta_y), (W//2 + 320, cta_y + 80)],
                       radius=40, fill=(*NEON_PINK, 245))
cta_text = "ORDER NOW ON SNAPCHAT"
bbox_cta = draw.textbbox((0, 0), cta_text, font=cta_font)
cw = bbox_cta[2] - bbox_cta[0]
draw.text(((W - cw) // 2, cta_y + 10), cta_text, fill=WHITE, font=cta_font)

# --- URL ---
url_y = cta_y + 100
url_text = "st-sh.vercel.app/menu"
bbox_u = draw.textbbox((0, 0), url_text, font=font_url)
uw = bbox_u[2] - bbox_u[0]
draw.text(((W - uw) // 2, url_y), url_text, fill=(*NEON_CYAN, 200), font=font_url)

# --- Snapchat handle ---
snap_y = url_y + 50
snap_text = "@kotycannaco on Snapchat"
bbox_s = draw.textbbox((0, 0), snap_text, font=font_bold_it)
sw2 = bbox_s[2] - bbox_s[0]
draw.text(((W - sw2) // 2, snap_y), snap_text, fill=(*WHITE, 180), font=font_bold_it)

# --- Footer ---
bar_h = 120
bar_y = H - bar_h
draw.rectangle([(0, bar_y), (W, H)], fill=(*DARK, 230))
brand_text = "KOTY CANNA CO."
bbox_b = draw.textbbox((0, 0), brand_text, font=font_sm)
bw = bbox_b[2] - bbox_b[0]
draw.text(((W - bw) // 2, bar_y + 22), brand_text, fill=WHITE, font=font_sm)

sub_brand = "Premium Vape Products"
bbox_sb = draw.textbbox((0, 0), sub_brand, font=font_pill)
sbw = bbox_sb[2] - bbox_sb[0]
draw.text(((W - sbw) // 2, bar_y + 72), sub_brand, fill=(*HOT_PINK, 200), font=font_pill)

# --- Save ---
final = img.convert('RGB')
final.save(r"C:\Users\msuse\Pictures\guthib\workspace-c33320dc-dc2b-4e3b-9483-b666d534738c (2)\workspace-c33320dc-dc2b-4e3b-9483-b666d534738c (2)~\social_post_today.png", quality=95)
print("Done - vertical 1080x1920")
