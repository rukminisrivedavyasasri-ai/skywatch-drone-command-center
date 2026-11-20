import os
from PIL import Image, ImageDraw

def create_sample_images():
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sample_data", "aerial_images")
    os.makedirs(out_dir, exist_ok=True)

    # 1. Aerial Road Junction
    img1 = Image.new("RGB", (800, 600), "#1E293B")
    draw1 = ImageDraw.Draw(img1)
    # Asphalt Roads
    draw1.rectangle([0, 240, 800, 360], fill="#334155")
    draw1.rectangle([340, 0, 460, 600], fill="#334155")
    # Lane divider dashes
    for x in range(0, 800, 40):
        if not (330 <= x <= 470):
            draw1.line([(x, 300), (x + 20, 300)], fill="#F8FAFC", width=3)
    for y in range(0, 600, 40):
        if not (230 <= y <= 370):
            draw1.line([(400, y), (400, y + 20)], fill="#F8FAFC", width=3)
    # Green verges
    draw1.rectangle([0, 0, 340, 240], fill="#064E3B")
    draw1.rectangle([460, 0, 800, 240], fill="#064E3B")
    draw1.rectangle([0, 360, 340, 600], fill="#064E3B")
    draw1.rectangle([460, 360, 800, 600], fill="#064E3B")
    # Vehicle 1 (Cyan car)
    draw1.rectangle([160, 260, 230, 295], fill="#0EA5E9", outline="#38BDF8", width=2)
    # Vehicle 2 (White SUV)
    draw1.rectangle([550, 310, 630, 345], fill="#E2E8F0", outline="#CBD5E1", width=2)
    # Vehicle 3 (Large Delivery Truck)
    draw1.rectangle([365, 80, 435, 180], fill="#D97706", outline="#F59E0B", width=2)
    # Pedestrians
    draw1.ellipse([310, 210, 322, 222], fill="#F43F5E")
    draw1.ellipse([325, 215, 337, 227], fill="#F43F5E")
    img1.save(os.path.join(out_dir, "aerial_sample_1.jpg"), "JPEG", quality=92)

    # 2. Aerial Waterfront & Promenade
    img2 = Image.new("RGB", (800, 600), "#0284C7")  # Water body
    draw2 = ImageDraw.Draw(img2)
    # Shoreline Promenade
    draw2.polygon([(0, 600), (800, 350), (800, 600)], fill="#475569")
    draw2.polygon([(0, 600), (800, 480), (800, 600)], fill="#047857")
    # Walkway pathway
    draw2.line([(0, 580), (800, 400)], fill="#94A3B8", width=18)
    # People walking along promenade
    people_coords = [(120, 560), (135, 555), (280, 520), (300, 515), (450, 480), (600, 445), (615, 440)]
    for px, py in people_coords:
        draw2.ellipse([px, py, px + 10, py + 10], fill="#FBBF24")
    # Patrol boat on water
    draw2.rectangle([250, 150, 360, 200], fill="#DC2626", outline="#EF4444", width=2)
    img2.save(os.path.join(out_dir, "aerial_sample_2.jpg"), "JPEG", quality=92)

    # 3. Industrial Warehouse & Depot Perimeter
    img3 = Image.new("RGB", (800, 600), "#1E293B")
    draw3 = ImageDraw.Draw(img3)
    # Warehouse roofs
    draw3.rectangle([50, 50, 350, 400], fill="#3B82F6", outline="#60A5FA", width=3)
    draw3.rectangle([450, 80, 750, 350], fill="#475569", outline="#64748B", width=3)
    # Loading bay concrete
    draw3.rectangle([50, 420, 750, 580], fill="#6B7280")
    # Cargo Trucks docked
    draw3.rectangle([120, 440, 180, 560], fill="#EA580C", outline="#F97316", width=2)
    draw3.rectangle([220, 440, 280, 560], fill="#EAB308", outline="#FACC15", width=2)
    draw3.rectangle([520, 450, 580, 560], fill="#10B981", outline="#34D399", width=2)
    # Security personnel
    draw3.ellipse([380, 490, 392, 502], fill="#EF4444")
    img3.save(os.path.join(out_dir, "aerial_sample_3.jpg"), "JPEG", quality=92)

    print("[SAMPLE] Generated 3 aerial surveillance test images in sample_data/aerial_images/")

if __name__ == "__main__":
    create_sample_images()
