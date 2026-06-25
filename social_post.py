from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import random

W, H = 1080, 1080
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
    if t < 0.3:
        r = int(SOFT_PINK[0] * (1 - t/0.3) + LAVENDER[0] * (t/0.3))
        g = int(SOFT_PINK[1] * (1 - t/0.3) + LAVENDER[1] * (t/0.3))
        b = int(SOFT_PINK[2] * (1 - t/0.3) + LAVENDER[2] * (t/0.3))
    elif t < 0.6:
        t2 = (t - 0.3) / 0.3
        r = int(LAVENDER[0] * (1 - t2) + BLUE[0] * t2)
        g = int(LAVENDER[1] * (1 - t2) + BLUE[1] * t2)
        b = int(LAVENDER[2] * (1 - t2) + BLUE[2] * t2)
    else:
        t2 = (t - 0.6) / 0.4
        r = int(BLUE[0] * (1 - t2) + SOFT_PINK[0] * t2)
        g = int(BLUE[1] * (1 - t2) + SOFT_PINK[1] * t2)
        b = int(BLUE[2] * (1 - t2) + SOFT_PINK[2] * t2)
    draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

# --- Decorative bokeh orbs ---
overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
odraw = ImageDraw.Draw(overlay)
random.seed(42)
orb_colors = [
    (255, 182, 193, 50), (173, 216, 230, 40), (200, 160, 255, 45),
    (255, 200, 180, 35), (152, 251, 200, 30),
]
for _ in range(18):
    cx = random.randint(-100, W + 100)
    cy = random.randint(-100, H + 100)
    rad = random.randint(80, 220)
    color = random.choice(orb_colors)
    odraw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=color)
overlay_blurred = overlay.filter(ImageFilter.GaussianBlur(radius=60))
img = Image.alpha_composite(img, overlay_blurred)
draw = ImageDraw.Draw(img)

# --- Top accent bar ---
draw.rectangle([(0, 0), (W, 6)], fill=(*PINK, 200))

# --- Star sparks ---
def draw_spark(d, cx, cy, size, color, alpha=180):
    pts = []
    for i in range(8):
        angle = math.radians(i * 45 - 90)
        r = size if i % 2 == 0 else size * 0.3
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    d.polygon(pts, fill=(*color, alpha))

for sx, sy, ss in [(120, 180, 12), (950, 150, 8), (180, 850, 10), (880, 800, 14),
                    (540, 120, 6), (80, 500, 9), (1000, 450, 7), (300, 950, 11),
                    (750, 950, 8), (500, 980, 10)]:
    draw_spark(draw, sx, sy, ss, WHITE, 160)

# --- Fonts ---
font_bold_big = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 120)
font_bold_med = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 68)
font_bold_sm = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 44)
font_reg = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Regular.ttf", 30)
font_pill = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Regular.ttf", 21)
font_pill_sm = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Regular.ttf", 18)
font_bold_it = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Bold.ttf", 34)

# --- "TOMORROW" ribbon ---
ribbon_y = 28
ribbon_h = 52
draw.rounded_rectangle([(80, ribbon_y), (W - 80, ribbon_y + ribbon_h)],
                       radius=26, fill=(*PINK, 220))
bbox = draw.textbbox((0, 0), "TOMORROW", font=font_bold_sm)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, ribbon_y + 4), "TOMORROW", fill=WHITE, font=font_bold_sm)

# --- "24" ---
num_text = "24"
bbox_num = draw.textbbox((0, 0), num_text, font=font_bold_big)
nw = bbox_num[2] - bbox_num[0]
draw.text(((W - nw) // 2 + 3, 107), num_text, fill=(0, 0, 0, 50), font=font_bold_big)
draw.text(((W - nw) // 2, 105), num_text, fill=(*DARK, 240), font=font_bold_big)

# --- "NEW EXOTIC FLAVORS" ---
sub_text = "NEW EXOTIC FLAVORS"
bbox_sub = draw.textbbox((0, 0), sub_text, font=font_bold_med)
sw = bbox_sub[2] - bbox_sub[0]
draw.text(((W - sw) // 2, 255), sub_text, fill=(*DARK, 220), font=font_bold_med)

# --- Decorative line ---
draw.rounded_rectangle([(W//2 - 150, 345), (W//2 + 150, 348)],
                       radius=2, fill=(*PINK, 180))

# --- Flavor pills ---
all_rows = [
    ["Apple Candy", "Apricot Jelly", "Banana Daze", "Banana Kush"],
    ["Bloodshot", "Blueberry Oatmeal", "Blueberry Pie", "Champagne"],
    ["Mint Chocolate", "Clementine Ice", "Frosted Grapes", "Golden Mango"],
    ["Grand Daddy Purple", "Green Crack", "Irish Cream", "Maple Pumpkin Pie"],
    ["Pink Flamingo", "Red Berry Punch", "Rootbeer", "Sour Watermelon"],
    ["Tangie", "Watermelon", "Cherry Jam", "Galactic Grape"],
]

pill_colors = [PINK, BLUE, LAVENDER, MINT, PEACH, SOFT_PINK, SOFT_BLUE]
pill_h = 36
pill_gap_x = 12
pill_gap_y = 10
start_y = 370

for ri, row in enumerate(all_rows):
    pill_data = []
    for fname in row:
        f = font_pill_sm if len(fname) > 15 else font_pill
        bbox = draw.textbbox((0, 0), fname.upper(), font=f)
        pw = bbox[2] - bbox[0] + 26
        pill_data.append((fname, f, pw))
    
    total_w = sum(p[2] for p in pill_data) + pill_gap_x * (len(row) - 1)
    sx = (W - total_w) // 2
    sy = start_y + ri * (pill_h + pill_gap_y)
    
    for ci, (fname, f, pw) in enumerate(pill_data):
        color = pill_colors[(ri * 4 + ci) % len(pill_colors)]
        draw.rounded_rectangle(
            [(sx, sy), (sx + pw, sy + pill_h)],
            radius=pill_h // 2,
            fill=(*color, 180)
        )
        bbox = draw.textbbox((0, 0), fname.upper(), font=f)
        tw = bbox[2] - bbox[0]
        draw.text((sx + (pw - tw) // 2, sy + 7), fname.upper(), fill=(*WHITE, 240), font=f)
        sx += pw + pill_gap_x

# --- Price pill ---
price_y = 680
price_box_w = 200
draw.rounded_rectangle([(W//2 - price_box_w, price_y), (W//2 + price_box_w, price_y + 56)],
                       radius=28, fill=(*DARK, 220))
price_text = "$15 CARTS  ·  $30 DISPOS"
bbox_p = draw.textbbox((0, 0), price_text, font=font_reg)
pw = bbox_p[2] - bbox_p[0]
draw.text(((W - pw) // 2, price_y + 12), price_text, fill=WHITE, font=font_reg)

# --- CTA ---
cta_y = 762
cta_font = ImageFont.truetype(f"{fonts_dir}/BigShoulders-Bold.ttf", 40)
draw.rounded_rectangle([(W//2 - 260, cta_y), (W//2 + 260, cta_y + 60)],
                       radius=30, fill=(*PINK, 240))
cta_text = "CHECK OUT THE MENU"
bbox_cta = draw.textbbox((0, 0), cta_text, font=cta_font)
cw = bbox_cta[2] - bbox_cta[0]
draw.text(((W - cw) // 2, cta_y + 8), cta_text, fill=WHITE, font=cta_font)

# --- URL ---
url_y = cta_y + 72
url_font = ImageFont.truetype(f"{fonts_dir}/InstrumentSans-Bold.ttf", 28)
url_text = "st-sh.vercel.app/menu"
bbox_u = draw.textbbox((0, 0), url_text, font=url_font)
uw = bbox_u[2] - bbox_u[0]
draw.text(((W - uw) // 2, url_y), url_text, fill=(*DARK, 200), font=url_font)

# --- Snapchat handle ---
snap_y = url_y + 40
snap_text = "@kotycannaco on Snapchat"
bbox_s = draw.textbbox((0, 0), snap_text, font=font_bold_it)
sw2 = bbox_s[2] - bbox_s[0]
draw.text(((W - sw2) // 2, snap_y), snap_text, fill=(*DARK, 180), font=font_bold_it)

# --- Footer ---
bar_h = 90
bar_y = H - bar_h
draw.rectangle([(0, bar_y), (W, H)], fill=(*DARK, 210))
brand_text = "KOTY CANNA CO."
bbox_b = draw.textbbox((0, 0), brand_text, font=font_bold_sm)
bw = bbox_b[2] - bbox_b[0]
draw.text(((W - bw) // 2, bar_y + 14), brand_text, fill=WHITE, font=font_bold_sm)

sub_brand = "Premium Vape Products"
bbox_sb = draw.textbbox((0, 0), sub_brand, font=font_pill)
sbw = bbox_sb[2] - bbox_sb[0]
draw.text(((W - sbw) // 2, bar_y + 52), sub_brand, fill=(*SOFT_PINK, 200), font=font_pill)

# --- Save ---
final = img.convert('RGB')
final.save(r"C:\Users\msuse\Pictures\guthib\workspace-c33320dc-dc2b-4e3b-9483-b666d534738c (2)\workspace-c33320dc-dc2b-4e3b-9483-b666d534738c (2)~\social_post.png", quality=95)
print("Done")
