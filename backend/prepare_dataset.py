"""
Dataset Preparation Script for Leopard Detection Model
Organizes images into train/val/test splits for binary classification
"""
import os
import shutil
from pathlib import Path
import random

# Set random seed for reproducibility
random.seed(42)

# Paths
DATASET_ROOT = Path(__file__).parent / "detaset"
LEOPARD_IMAGES = DATASET_ROOT / "animals" / "leopard"
OUTPUT_DIR = Path(__file__).parent / "prepared_dataset"

# Split ratios
TRAIN_RATIO = 0.7
VAL_RATIO = 0.15
TEST_RATIO = 0.15


def prepare_dataset():
    """
    Prepare dataset for binary classification (Leopard vs Not Leopard)
    """
    print("=" * 60)
    print("🐆 Leopard Detection Dataset Preparation")
    print("=" * 60)
    
    # Create output directories
    for split in ['train', 'val', 'test']:
        for category in ['leopard', 'not_leopard']:
            path = OUTPUT_DIR / split / category
            path.mkdir(parents=True, exist_ok=True)
    
    # Get all leopard images
    leopard_images = []
    for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
        leopard_images.extend(list(LEOPARD_IMAGES.glob(f'*{ext}')))
    
    print(f"\n📊 Found {len(leopard_images)} leopard images")
    
    # Remove corrupted files (those ending with !d)
    leopard_images = [img for img in leopard_images if not img.name.endswith('!d')]
    print(f"📊 Valid leopard images: {len(leopard_images)}")
    
    # Shuffle images
    random.shuffle(leopard_images)
    
    # Calculate split indices
    n_total = len(leopard_images)
    n_train = int(n_total * TRAIN_RATIO)
    n_val = int(n_total * VAL_RATIO)
    
    # Split leopard images
    train_leopard = leopard_images[:n_train]
    val_leopard = leopard_images[n_train:n_train + n_val]
    test_leopard = leopard_images[n_train + n_val:]
    
    print(f"\n📂 Split Statistics:")
    print(f"   Train: {len(train_leopard)} leopard images")
    print(f"   Val:   {len(val_leopard)} leopard images")
    print(f"   Test:  {len(test_leopard)} leopard images")
    
    # Copy leopard images
    print("\n📋 Copying leopard images...")
    copy_images(train_leopard, OUTPUT_DIR / 'train' / 'leopard')
    copy_images(val_leopard, OUTPUT_DIR / 'val' / 'leopard')
    copy_images(test_leopard, OUTPUT_DIR / 'test' / 'leopard')
    
    # Process other animals as "not_leopard"
    other_animals = ['cheetah', 'lion', 'tiger']
    all_not_leopard = []
    
    for animal in other_animals:
        animal_path = DATASET_ROOT / "animals" / animal
        if animal_path.exists():
            images = []
            for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                images.extend(list(animal_path.glob(f'*{ext}')))
            images = [img for img in images if not img.name.endswith('!d')]
            all_not_leopard.extend(images)
            print(f"   Found {len(images)} {animal} images")
    
    print(f"\n📊 Total 'not_leopard' images: {len(all_not_leopard)}")
    
    # Balance dataset - use same number of not_leopard as leopard
    if len(all_not_leopard) > len(leopard_images):
        all_not_leopard = random.sample(all_not_leopard, len(leopard_images))
        print(f"   Balanced to {len(all_not_leopard)} images")
    
    random.shuffle(all_not_leopard)
    
    # Split not_leopard images
    n_total_not = len(all_not_leopard)
    n_train_not = int(n_total_not * TRAIN_RATIO)
    n_val_not = int(n_total_not * VAL_RATIO)
    
    train_not_leopard = all_not_leopard[:n_train_not]
    val_not_leopard = all_not_leopard[n_train_not:n_train_not + n_val_not]
    test_not_leopard = all_not_leopard[n_train_not + n_val_not:]
    
    print(f"\n📂 Not-Leopard Split:")
    print(f"   Train: {len(train_not_leopard)} images")
    print(f"   Val:   {len(val_not_leopard)} images")
    print(f"   Test:  {len(test_not_leopard)} images")
    
    # Copy not_leopard images
    print("\n📋 Copying not_leopard images...")
    copy_images(train_not_leopard, OUTPUT_DIR / 'train' / 'not_leopard')
    copy_images(val_not_leopard, OUTPUT_DIR / 'val' / 'not_leopard')
    copy_images(test_not_leopard, OUTPUT_DIR / 'test' / 'not_leopard')
    
    print("\n✅ Dataset preparation complete!")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print("\n" + "=" * 60)


def copy_images(image_list, destination):
    """Copy images to destination directory"""
    for i, img_path in enumerate(image_list):
        try:
            dest_path = destination / f"{i:04d}_{img_path.name}"
            shutil.copy2(img_path, dest_path)
        except Exception as e:
            print(f"   ⚠️  Error copying {img_path.name}: {e}")


if __name__ == "__main__":
    prepare_dataset()
