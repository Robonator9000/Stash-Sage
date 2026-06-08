#!/usr/bin/env python3
"""Generate animated background art GIFs for Stash Tracker."""
import sys, os, math, random
# Fix Unicode print on Windows
os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, r'C:\Users\msuse\.agents\skills\slack-gif-creator')
from core.gif_builder import GIFBuilder
from core.frame_composer import create_gradient_background, draw_circle
from PIL import Image, ImageDraw

W, H = 480, 480
FPS = 15
FRAMES = 60

def make_particles(count, w, h):
    return [{
        'x': random.uniform(0, w),
        'y': random.uniform(0, h),
        'vx': random.uniform(-0.3, 0.3),
        'vy': random.uniform(-0.6, -0.2),
        'size': random.uniform(2, 5),
        'hue': random.uniform(170, 190),
        'alpha': random.uniform(0.1, 0.5),
    } for _ in range(count)]

def make_bg_gif(is_dark):
    suffix = 'dark' if is_dark else 'light'
    output = f'public/bg-{suffix}.gif'
    
    builder = GIFBuilder(width=W, height=H, fps=FPS)
    
    if is_dark:
        top = (8, 12, 28)
        mid = (10, 20, 45)
        bot = (6, 10, 22)
        particle_colors = [(6, 182, 212), (16, 185, 129), (56, 189, 248), (52, 211, 153)]
    else:
        top = (230, 240, 250)
        mid = (240, 248, 255)
        bot = (220, 235, 245)
        particle_colors = [(6, 182, 212), (16, 185, 129), (14, 165, 233), (5, 150, 105)]
    
    particles = make_particles(30, W, H)
    
    for frame_idx in range(FRAMES):
        t = frame_idx / FRAMES
        grad = create_gradient_background(W, H, top, bot)
        draw = ImageDraw.Draw(grad)
        
        orb_x = W // 2 + int(math.sin(t * 2 * math.pi) * 120)
        orb_y = H // 2 + int(math.cos(t * 1.3 * math.pi) * 80)
        
        for layers in range(3):
            r = 150 + layers * 60
            ratio = 0.04 - layers * 0.01
            alpha_color = (6, 182, 212) if is_dark else (16, 185, 129)
            for _ in range(3):
                ox = orb_x + random.randint(-20, 20)
                oy = orb_y + random.randint(-20, 20)
                rr = r + random.randint(-10, 10)
                draw.ellipse([ox - rr, oy - rr, ox + rr, oy + rr], 
                    fill=(*alpha_color, max(0, min(255, int(255 * ratio)))))
                del ox, oy, rr
        
        for p in particles:
            p['x'] += p['vx'] + math.sin(t * 2 * math.pi + p['hue']) * 0.2
            p['y'] += p['vy']
            if p['y'] < -10:
                p['y'] = H + 10
                p['x'] = random.uniform(0, W)
            if p['x'] < -10: p['x'] = W + 10
            if p['x'] > W + 10: p['x'] = -10
            
            r, g, b = particle_colors[frame_idx % len(particle_colors)]
            alpha = int(255 * p['alpha'])
            for glow in range(2):
                gs = p['size'] + glow * 4
                draw.ellipse([
                    p['x'] - gs, p['y'] - gs,
                    p['x'] + gs, p['y'] + gs
                ], fill=(r, g, b, alpha // (glow + 2)))
        
        builder.add_frame(grad)
    
    builder.save(output, num_colors=128, optimize_for_emoji=False, remove_duplicates=True)
    return output

if __name__ == '__main__':
    print("Generating dark mode background...")
    dk = make_bg_gif(is_dark=True)
    print(f"  -> {dk}")
    print("Generating light mode background...")
    lt = make_bg_gif(is_dark=False)
    print(f"  -> {lt}")
    print("Done! Both backgrounds generated.")
