from PIL import Image, ImageDraw
import os

# Create icons directory if it doesn't exist
os.makedirs('icons', exist_ok=True)

# Define the ClarityLog brand colors
bg_color = (37, 99, 235)  # Blue color matching the app
text_color = (255, 255, 255)  # White

def create_icon(size):
    # Create image with rounded rectangle background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle background
    margin = max(1, size // 16)
    corner_radius = max(2, size // 5)
    draw.rounded_rectangle(
        [margin, margin, size-margin, size-margin], 
        radius=corner_radius, 
        fill=bg_color
    )
    
    # Draw simple "C" letter for ClarityLog
    if size >= 32:
        # Larger icons get more detail
        font_size = size // 2
        text_x = size // 2 - font_size // 3
        text_y = size // 2 - font_size // 2
        
        # Draw a simple "C" shape with lines
        line_width = max(2, size // 12)
        c_size = font_size
        c_x = size // 2 - c_size // 2
        c_y = size // 2 - c_size // 2
        
        # Top horizontal line
        draw.rectangle([c_x, c_y, c_x + c_size - line_width, c_y + line_width], fill=text_color)
        # Left vertical line  
        draw.rectangle([c_x, c_y, c_x + line_width, c_y + c_size], fill=text_color)
        # Bottom horizontal line
        draw.rectangle([c_x, c_y + c_size - line_width, c_x + c_size - line_width, c_y + c_size], fill=text_color)
    else:
        # Smaller icons get a simple dot pattern
        dot_size = max(1, size // 8)
        center = size // 2
        for i in range(3):
            y = center - dot_size + (i * dot_size // 2)
            draw.ellipse([center - dot_size//2, y, center + dot_size//2, y + dot_size], fill=text_color)
    
    return img

# Create the required icon sizes
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon(size)
    icon.save(f'icons/icon{size}.png', 'PNG')
    print(f"Created icon{size}.png")

print("All extension icons created successfully!")
