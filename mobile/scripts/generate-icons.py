from PIL import Image
import os

SRC = r"C:\Users\nithi\.cursor\projects\d-c-disk-Downloads-E-commerce-main-1-E-commerce-main\assets\c__Users_nithi_AppData_Roaming_Cursor_User_workspaceStorage_ccf9c86e199ad29d685156fc4c8f7187_images_image-1f268859-7bf7-4acb-9da0-641f54a6dc25.png"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")
SIZE = 1024
BG = (28, 28, 28, 255)

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

print("Done:", OUT_DIR)
