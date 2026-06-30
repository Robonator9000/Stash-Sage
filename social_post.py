from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import random

W, H = 1080, 1920
img = Image.new('RGBA', (W, H))
draw = ImageDraw.Draw(img)

# Cotton candy palette
PINK = (255, 105, 180)
SOFT_PINK = (255, 182, 193)
BLUE = (135, 206, 250)
SOFT_BLUE = (173, 216, 230)
LAVENDER = (200, 160, 255)
MINT = (152, 251, 200)
PEACH = (255, 200, 180)
WHITE = (255, 255, 255)
DARK = (30, 15, 40)

fonts_dir = r"C:\Users\msuse\.claude\skills\canvas-design\canvas-fonts"

# --- Background gradient (vertical cotton candy) ---
for y in range(H):
    t = y / H
    if t < 0.25:
        r = int(SOFT_PINK[0] * (1 - t/0.25) + LAVENDER[0] * (t/0.25))
        g = int(SOFT_PINK[1] * (1 - t/0.25) + LAVENDER[1] * (t/0.25))
        b = int(SOFT_PINK[2] * (1 - t/0.25) + LAVENDER[2] * (t/0.25))
    elif t < 0.50:
        t2 = (t - 0.25) / 0.25
        r = int(LAVENDER[0] * (1 - t2) + BLUE[0] * t2)
        g = int(LAVENDER[1] * (1 - t2) + BLUE[1] * t2)
        b = int(LAVENDER[2] * (1 - t2) + BLUE[2] * t2)
    elif t < 0.75:
        t3 = (t - 0.50) / 0.25
        r = int(BLUE[0] * (1 - t3) + MINT[0] * t3)
        g = int(BLUE[1] * (1 - t3) + MINT[1] * t3)
        b = int(BLUE[2] * (1 - t3) + MINT[2] * t3)
    else:
        t4 = (t - 0.75) / 0.25
        r = int(MINT[0] * (1 - t4) + SOFT_PINK[0] * t4)
        g = int(MINT[1] * (1 - t4) + SOFT_PINK[1] * t4)
        b = int(MINT[2] * (1 - t4) + SOFT_PINK[2] * t4)
    draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

# --- Decorative bokeh orbs ---
overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
odraw = ImageDraw.Draw(overlay)
random.seed(42)
orb_colors = [
    (255, 182, 193, 50), (173, 216, 230, 40), (200, 160, 255, 45),
    (255, 200, 180, 35), (152, 251, 200, 30),
]
for _ in range(24):
    cx = random.randint(-100, W + 100)
    cy = random.randint(-100, H + 100)
    rad = random.randint(100, 280)
    color = random.choice(orb_colors)
    odraw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=color)
overlay_blurred = overlay.filter(ImageFilter.GaussianBlur(radius=70))
img = Image.alpha_composite(img, overlay_blurred)
draw = ImageDraw.Draw(img)

# --- Top accent bar ---
draw.rectangle([(0, 0), (W, 8)], fill=(*PINK, 200))

# --- Star sparks ---
def draw_spark(d, cx, cy, size, color, alpha=180):
    pts = []
    for i in range(8):
        angle = math.radians(i * 45 - 90)
        r = size if i % 2 == 0 else size * 0.3
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    d.polygon(pts, fill=(*color, alpha))

sparkles = [
    (120, 200, 14), (950, 180, 10), (180, 1100, 12), (880, 1050, 16),
    (540, 140, 8), (80, 650, 11), (1000, 600, 9), (300, 1350, 13),
    (750, 1400, 10), (500, 1650, 12), (200, 400, 8), (850, 300, 7),
    (100, 1600, 9), (900, 700, 11), (540, 1750, 7),
]
for sx, sy, ss in sparkles:
    draw_spark(draw, sx, sy, ss, WHITE, 160)

# --- Fonts ---
font_bold_big = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 160)
font_bold_med = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 80)
font_bold_sm = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 52)
font_reg = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Regular.ttf", 36)
font_pill = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Regular.ttf", 26)
font_pill_sm = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Regular.ttf", 22)
font_bold_it = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Bold.ttf", 42)
font_url = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Bold.ttf", 34)

# --- "TOMORROW" ribbon ---
ribbon_y = 60
ribbon_h = 64
draw.rounded_rectangle([(100, ribbon_y), (W - 100, ribbon_y + ribbon_h)],
                       radius=32, fill=(*PINK, 220))
bbox = draw.textbbox((0, 0), "TOMORROW", font=font_bold_sm)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, ribbon_y + 4), "TOMORROW", fill=WHITE, font=font_bold_sm)

# --- "24" ---
num_text = "24"
bbox_num = draw.textbbox((0, 0), num_text, font=font_bold_big)
nw = bbox_num[2] - bbox_num[0]
draw.text(((W - nw) // 2 + 4, 160), num_text, fill=(0, 0, 0, 50), font=font_bold_big)
draw.text(((W - nw) // 2, 155), num_text, fill=(*DARK, 240), font=font_bold_big)

# --- "NEW EXOTIC FLAVORS" ---
sub_text = "NEW EXOTIC FLAVORS"
bbox_sub = draw.textbbox((0, 0), sub_text, font=font_bold_med)
sw = bbox_sub[2] - bbox_sub[0]
draw.text(((W - sw) // 2, 335), sub_text, fill=(*DARK, 220), font=font_bold_med)

# --- Decorative line ---
draw.rounded_rectangle([(W//2 - 180, 440), (W//2 + 180, 444)],
                       radius=2, fill=(*PINK, 180))

# --- Flavor pills (2 columns for vertical layout) ---
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

pill_colors = [PINK, BLUE, LAVENDER, MINT, PEACH, SOFT_PINK, SOFT_BLUE]
pill_h = 50
pill_gap_x = 16
pill_gap_y = 14
start_y = 480
col_width = (W - 100 - pill_gap_x) // 2  # 2 columns with 100px margin

for ri, row in enumerate(all_rows):
    sy = start_y + ri * (pill_h + pill_gap_y)
    sx_left = 50
    sx_right = 50 + col_width + pill_gap_x

    for ci, fname in enumerate(row):
        f = font_pill_sm if len(fname) > 16 else font_pill
        bbox = draw.textbbox((0, 0), fname.upper(), font=f)
        pw = bbox[2] - bbox[0] + 32
        sx = sx_left if ci == 0 else sx_right
        # Center each pill in its column
        px = sx + (col_width - pw) // 2

        color = pill_colors[(ri * 2 + ci) % len(pill_colors)]
        draw.rounded_rectangle(
            [(px, sy), (px + pw, sy + pill_h)],
            radius=pill_h // 2,
            fill=(*color, 180)
        )
        bbox = draw.textbbox((0, 0), fname.upper(), font=f)
        tw = bbox[2] - bbox[0]
        draw.text((px + (pw - tw) // 2, sy + 10), fname.upper(), fill=(*WHITE, 240), font=f)

# --- Price pill (positioned after pills end: 480 + 12*(50+14) = 1248) ---
price_y = 1290
price_box_w = 240
draw.rounded_rectangle([(W//2 - price_box_w, price_y), (W//2 + price_box_w, price_y + 70)],
                       radius=35, fill=(*DARK, 220))
price_text = "$15 CARTS  ·  $30 DISPOS"
bbox_p = draw.textbbox((0, 0), price_text, font=font_reg)
pw = bbox_p[2] - bbox_p[0]
draw.text(((W - pw) // 2, price_y + 14), price_text, fill=WHITE, font=font_reg)

# --- CTA button ---
cta_y = 1380
cta_font = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 52)
draw.rounded_rectangle([(W//2 - 300, cta_y), (W//2 + 300, cta_y + 80)],
                       radius=40, fill=(*PINK, 240))
cta_text = "CHECK OUT THE MENU"
bbox_cta = draw.textbbox((0, 0), cta_text, font=cta_font)
cw = bbox_cta[2] - bbox_cta[0]
draw.text(((W - cw) // 2, cta_y + 12), cta_text, fill=WHITE, font=cta_font)

# --- URL ---
url_y = cta_y + 100
url_text = "st-sh.vercel.app/menu"
bbox_u = draw.textbbox((0, 0), url_text, font=font_url)
uw = bbox_u[2] - bbox_u[0]
draw.text(((W - uw) // 2, url_y), url_text, fill=(*DARK, 200), font=font_url)

# --- Snapchat handle ---
snap_y = url_y + 50
snap_text = "@kotycannaco on Snapchat"
bbox_s = draw.textbbox((0, 0), snap_text, font=font_bold_it)
sw2 = bbox_s[2] - bbox_s[0]
draw.text(((W - sw2) // 2, snap_y), snap_text, fill=(*DARK, 180), font=font_bold_it)

# --- Footer ---
bar_y = H - 120
draw.rectangle([(0, bar_y), (W, H)], fill=(*DARK, 210))
brand_text = "KOTY CANNA CO."
bbox_b = draw.textbbox((0, 0), brand_text, font=font_bold_sm)
bw = bbox_b[2] - bbox_b[0]
draw.text(((W - bw) // 2, bar_y + 22), brand_text, fill=WHITE, font=font_bold_sm)

sub_brand = "Premium Vape Products"
bbox_sb = draw.textbbox((0, 0), sub_brand, font=font_pill)
sbw = bbox_sb[2] - bbox_sb[0]
draw.text(((W - sbw) // 2, bar_y + 72), sub_brand, fill=(*SOFT_PINK, 200), font=font_pill)

# --- Save ---
final = img.convert('RGB')
final.save(r"C:\Users\msuse\Pictures\guthib\workspace-c33320dc-dc2b-4e3b-9483-b666d534738c (2)\workspace-c33320dc-dc2b-4e3b-9483-b666d534738c (2)~\social_post.png", quality=95)
print("Done - vertical 1080x1920")
