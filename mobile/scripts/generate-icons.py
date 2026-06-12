from PIL import Image
import os

SRC = r"C:\Users\nithi\.cursor\projects\d-c-disk-Downloads-E-commerce-main-E-commerce-main\assets\c__Users_nithi_AppData_Roaming_Cursor_User_workspaceStorage_6c7faf70d7b6250ab5e82e8936693cde_images_Screenshot_2026-06-01_213649-098053bc-a253-4e32-88b8-e2d3f8b6df99.png"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")
SIZE = 1024
# Deep maroon from Yuvarani Silks brand logo
BG = (107, 21, 32, 255)

img = Image.open(SRC).convert("RGBA")
w, h = img.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
square = img.crop((left, top, left + side, top + side))


def make_icon(fill_ratio, transparent_bg=False):
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0) if transparent_bg else BG)
    logo_size = int(SIZE * fill_ratio)
    logo = square.resize((logo_size, logo_size), Image.LANCZOS)
    offset = (SIZE - logo_size) // 2
    canvas.paste(logo, (offset, offset), logo)
    return canvas


icon = make_icon(0.95, transparent_bg=False)
icon.save(os.path.join(OUT_DIR, "icon.png"), "PNG")

adaptive = make_icon(0.72, transparent_bg=True)
adaptive.save(os.path.join(OUT_DIR, "adaptive-icon.png"), "PNG")

splash = make_icon(0.55, transparent_bg=False)
splash.save(os.path.join(OUT_DIR, "splash.png"), "PNG")

print("Done:", OUT_DIR)
