"""
Quick utility script to check dataset statistics
"""
from pathlib import Path
from collections import defaultdict

DATASET_ROOT = Path(__file__).parent / "detaset" / "animals"


def count_images_by_type(directory):
    """Count images by extension"""
    counts = defaultdict(int)
    for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
        counts[ext] = len(list(directory.glob(f'*{ext}')))
    return counts


def main():
    print("=" * 60)
    print("📊 Dataset Statistics")
    print("=" * 60)
    
    if not DATASET_ROOT.exists():
        print(f"❌ Dataset directory not found: {DATASET_ROOT}")
        return
    
    animals = ['leopard', 'cheetah', 'lion', 'tiger']
    total = 0
    
    for animal in animals:
        animal_path = DATASET_ROOT / animal
        if animal_path.exists():
            images = []
            for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                images.extend(list(animal_path.glob(f'*{ext}')))
            
            # Filter out corrupted files
            valid_images = [img for img in images if not img.name.endswith('!d')]
            corrupted = len(images) - len(valid_images)
            
            print(f"\n🐾 {animal.upper()}")
            print(f"   Total files: {len(images)}")
            print(f"   Valid images: {len(valid_images)}")
            if corrupted > 0:
                print(f"   Corrupted: {corrupted}")
            
            total += len(valid_images)
        else:
            print(f"\n🐾 {animal.upper()}: Not found")
    
    print("\n" + "=" * 60)
    print(f"📊 Total valid images: {total}")
    print("=" * 60)
    
    # Check prepared dataset
    prepared_path = Path(__file__).parent / "prepared_dataset"
    if prepared_path.exists():
        print("\n📂 Prepared Dataset:")
        for split in ['train', 'val', 'test']:
            split_path = prepared_path / split
            if split_path.exists():
                leopard_count = len(list((split_path / 'leopard').glob('*.*')))
                not_leopard_count = len(list((split_path / 'not_leopard').glob('*.*')))
                print(f"   {split.upper():5} - Leopard: {leopard_count:4d} | Not Leopard: {not_leopard_count:4d}")


if __name__ == "__main__":
    main()
