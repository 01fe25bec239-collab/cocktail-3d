import os
from PIL import Image

IMAGE_DIR = "/Applications/cocktail_3d../public/assets/images"

def compress_images():
    if not os.path.exists(IMAGE_DIR):
        print(f"Directory not found: {IMAGE_DIR}")
        return

    files = [f for f in os.listdir(IMAGE_DIR) if f.endswith(".png")]
    print(f"Found {len(files)} PNG images to convert.")

    total_old_size = 0
    total_new_size = 0

    for file in files:
        old_path = os.path.join(IMAGE_DIR, file)
        new_file_name = file.rsplit(".", 1)[0] + ".webp"
        new_path = os.path.join(IMAGE_DIR, new_file_name)

        old_size = os.path.getsize(old_path)
        total_old_size += old_size

        try:
            with Image.open(old_path) as img:
                # Save as WebP with quality 85 for high fidelity but great compression
                img.save(new_path, "WEBP", quality=85)
            
            new_size = os.path.getsize(new_path)
            total_new_size += new_size

            reduction = (old_size - new_size) / old_size * 100
            print(f"Converted {file}: {old_size / (1024*1024):.2f}MB -> {new_size / (1024*1024):.2f}MB ({reduction:.1f}% reduction)")
        except Exception as e:
            print(f"Error converting {file}: {e}")

    if total_old_size > 0:
        overall_reduction = (total_old_size - total_new_size) / total_old_size * 100
        print("\n=== Summary ===")
        print(f"Total old size: {total_old_size / (1024*1024):.2f}MB")
        print(f"Total new size: {total_new_size / (1024*1024):.2f}MB")
        print(f"Overall reduction: {overall_reduction:.1f}%")

if __name__ == "__main__":
    compress_images()
