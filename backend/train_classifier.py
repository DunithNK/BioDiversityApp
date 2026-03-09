"""
Thermal Leopard Binary Classifier — Training Script
====================================================
Trains a MobileNetV2 model to classify images as:
  - leopard     (class 0) → thermal or regular leopard images → ACCEPT
  - nonleopard  (class 1) → regular animal photos / non-leopard → REJECT

Dataset layout expected:
  NewDetaset/
  ├── leopard/       ← thermal + any leopard images  (387 images)
  └── nonleopard/    ← non-leopard photos            (54 images)

Output:
  models/leopard_classifier.pt              ← best model weights
  models/classifier_training_history.json   ← epoch metrics
"""

import os
import random
import shutil
import json
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from PIL import Image

# ─── CONFIG ────────────────────────────────────────────────────────────────────
DATASET_DIR   = Path("NewDetaset")
PREPARED_DIR  = Path("prepared_classifier_dataset")
MODEL_SAVE    = Path("models/leopard_classifier.pt")

IMG_SIZE      = 224
BATCH_SIZE    = 16
EPOCHS        = 40
LR            = 0.001
TRAIN_SPLIT   = 0.80
EARLY_STOP    = 10
SEED          = 42

CLASSES = ["leopard", "nonleopard"]   # alphabetical = index [0, 1]

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# ───────────────────────────────────────────────────────────────────────────────

random.seed(SEED)
torch.manual_seed(SEED)


# ── Step 1: Prepare split dataset ──────────────────────────────────────────────

def prepare_split_dataset(force: bool = False):
    """
    Copy NewDetaset images into prepared_classifier_dataset/{train,val}/{class}/
    with an 80 / 20 stratified split.
    """
    if (PREPARED_DIR / "train" / "leopard").exists() and not force:
        print(f"[PREP] Using existing split at '{PREPARED_DIR}' (pass force=True to redo)")
        return

    print("[PREP] Splitting dataset…")
    for split in ("train", "val"):
        for cls in CLASSES:
            (PREPARED_DIR / split / cls).mkdir(parents=True, exist_ok=True)

    for cls in CLASSES:
        src_dir = DATASET_DIR / cls
        exts    = {".jpg", ".jpeg", ".png", ".bmp", ".gif"}
        images  = [f for f in src_dir.glob("*") if f.suffix.lower() in exts]
        random.shuffle(images)

        n_train = int(len(images) * TRAIN_SPLIT)
        for img in images[:n_train]:
            shutil.copy2(img, PREPARED_DIR / "train" / cls / img.name)
        for img in images[n_train:]:
            shutil.copy2(img, PREPARED_DIR / "val"   / cls / img.name)

        print(f"  {cls:12s}: {n_train} train  +  {len(images) - n_train} val  =  {len(images)} total")

    print(f"[PREP] Done → '{PREPARED_DIR}'\n")


# ── Step 2: Dataset class ───────────────────────────────────────────────────────

class LeopardDataset(Dataset):
    """Simple image + label dataset loaded from two class folders."""

    EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".gif"}
    CLASS_TO_IDX = {cls: idx for idx, cls in enumerate(CLASSES)}

    def __init__(self, root_dir: Path, transform=None):
        self.transform = transform
        self.samples: list[tuple[Path, int]] = []

        for cls in CLASSES:
            for img_path in (root_dir / cls).glob("*"):
                if img_path.suffix.lower() in self.EXTS:
                    self.samples.append((img_path, self.CLASS_TO_IDX[cls]))

        random.shuffle(self.samples)

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        try:
            img = Image.open(img_path).convert("RGB")
        except Exception:
            img = Image.new("RGB", (IMG_SIZE, IMG_SIZE), (128, 128, 128))
        if self.transform:
            img = self.transform(img)
        return img, label


# ── Step 3: Build MobileNetV2 model ────────────────────────────────────────────

def build_model() -> nn.Module:
    """
    MobileNetV2 pre-trained on ImageNet.
    Base frozen; only the 2-class classifier head is trainable initially.
    """
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)

    # Freeze feature extractor
    for param in model.features.parameters():
        param.requires_grad = False

    # Replace final classification head  (1280 → 2)
    model.classifier[1] = nn.Linear(1280, 2)

    return model.to(DEVICE)


# ── Step 4: Training loop ───────────────────────────────────────────────────────

def count_class_images(split: str, cls: str) -> int:
    return len(list((PREPARED_DIR / split / cls).glob("*")))


def train():
    # --- Prepare data split ---
    prepare_split_dataset()

    # --- Transforms ---
    train_tf = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(p=0.1),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
        transforms.RandomGrayscale(p=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    train_ds = LeopardDataset(PREPARED_DIR / "train", transform=train_tf)
    val_ds   = LeopardDataset(PREPARED_DIR / "val",   transform=val_tf)

    print(f"[DATA] Train: {len(train_ds)}  |  Val: {len(val_ds)}")

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0, pin_memory=False)
    val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=False)

    # --- Class weights (handle imbalance) ---
    n_leo = count_class_images("train", "leopard")
    n_non = count_class_images("train", "nonleopard")
    total = n_leo + n_non
    weights = torch.tensor([total / (2.0 * n_leo), total / (2.0 * n_non)]).to(DEVICE)
    print(f"[DATA] Class weights → leopard: {weights[0]:.3f}  nonleopard: {weights[1]:.3f}\n")

    # --- Model, Loss, Optimizer ---
    model     = build_model()
    criterion = nn.CrossEntropyLoss(weight=weights)
    optimizer = optim.Adam(model.classifier.parameters(), lr=LR)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)

    best_val_acc   = 0.0
    patience_count = 0
    history        = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}

    print(f"[TRAIN] Device: {DEVICE}  |  Epochs: {EPOCHS}  |  Batch: {BATCH_SIZE}")
    print("=" * 70)

    for epoch in range(EPOCHS):

        # ── Training ──────────────────────────────────────────────────────────
        model.train()
        t_loss = t_correct = 0

        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            out  = model(images)
            loss = criterion(out, labels)
            loss.backward()
            optimizer.step()

            t_loss    += loss.item() * images.size(0)
            t_correct += (out.argmax(1) == labels).sum().item()

        t_loss /= len(train_ds)
        t_acc   = t_correct / len(train_ds)

        # ── Validation ────────────────────────────────────────────────────────
        model.eval()
        v_loss = v_correct = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                out  = model(images)
                loss = criterion(out, labels)

                v_loss    += loss.item() * images.size(0)
                v_correct += (out.argmax(1) == labels).sum().item()

        v_loss /= len(val_ds)
        v_acc   = v_correct / len(val_ds)

        scheduler.step(v_loss)

        history["train_loss"].append(round(t_loss, 6))
        history["val_loss"].append(round(v_loss, 6))
        history["train_acc"].append(round(t_acc,  6))
        history["val_acc"].append(round(v_acc,   6))

        tag = ""
        if v_acc > best_val_acc:
            best_val_acc   = v_acc
            MODEL_SAVE.parent.mkdir(parents=True, exist_ok=True)
            torch.save(model.state_dict(), MODEL_SAVE)
            tag            = "  ✅ SAVED"
            patience_count = 0
        else:
            patience_count += 1

        print(
            f"Epoch {epoch+1:3d}/{EPOCHS}  "
            f"| Train  loss={t_loss:.4f}  acc={t_acc:.4f}  "
            f"| Val  loss={v_loss:.4f}  acc={v_acc:.4f}{tag}"
        )

        if patience_count >= EARLY_STOP:
            print(f"\n[TRAIN] Early stopping at epoch {epoch + 1} (no improvement for {EARLY_STOP} epochs)")
            break

    # ── Phase 2: Fine-tune last 5 MobileNetV2 blocks ─────────────────────────
    print("\n[FINE-TUNE] Unfreezing last 5 feature blocks for fine-tuning…")
    model.load_state_dict(torch.load(MODEL_SAVE, map_location=DEVICE))   # restore best weights

    # Unfreeze the last 5 layers of features
    total_feature_layers = len(list(model.features.parameters()))
    for i, param in enumerate(model.features.parameters()):
        if i >= total_feature_layers - 5:
            param.requires_grad = True

    fine_optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR * 0.1
    )
    fine_scheduler  = optim.lr_scheduler.ReduceLROnPlateau(fine_optimizer, patience=3, factor=0.5)
    patience_count  = 0
    FINE_EPOCHS     = 15
    FINE_PATIENCE   = 5

    print(f"[FINE-TUNE] Running {FINE_EPOCHS} more epochs with lr={LR * 0.1}")
    print("-" * 70)

    for epoch in range(FINE_EPOCHS):
        model.train()
        t_loss = t_correct = 0

        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            fine_optimizer.zero_grad()
            out  = model(images)
            loss = criterion(out, labels)
            loss.backward()
            fine_optimizer.step()

            t_loss    += loss.item() * images.size(0)
            t_correct += (out.argmax(1) == labels).sum().item()

        t_loss /= len(train_ds)
        t_acc   = t_correct / len(train_ds)

        model.eval()
        v_loss = v_correct = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                out  = model(images)
                loss = criterion(out, labels)
                v_loss    += loss.item() * images.size(0)
                v_correct += (out.argmax(1) == labels).sum().item()

        v_loss /= len(val_ds)
        v_acc   = v_correct / len(val_ds)

        fine_scheduler.step(v_loss)

        history["train_loss"].append(round(t_loss, 6))
        history["val_loss"].append(round(v_loss, 6))
        history["train_acc"].append(round(t_acc,  6))
        history["val_acc"].append(round(v_acc,   6))

        tag = ""
        if v_acc > best_val_acc:
            best_val_acc   = v_acc
            torch.save(model.state_dict(), MODEL_SAVE)
            tag            = "  ✅ SAVED"
            patience_count = 0
        else:
            patience_count += 1

        print(
            f"Fine {epoch+1:3d}/{FINE_EPOCHS}  "
            f"| Train  loss={t_loss:.4f}  acc={t_acc:.4f}  "
            f"| Val  loss={v_loss:.4f}  acc={v_acc:.4f}{tag}"
        )

        if patience_count >= FINE_PATIENCE:
            print(f"\n[FINE-TUNE] Early stopping at fine-tune epoch {epoch + 1}")
            break

    # ── Save history ──────────────────────────────────────────────────────────
    history_path = Path("models/classifier_training_history.json")
    with open(history_path, "w") as f:
        json.dump(
            {
                "best_val_acc": round(best_val_acc, 6),
                "total_epochs": len(history["val_acc"]),
                "classes": CLASSES,
                "class_to_idx": {c: i for i, c in enumerate(CLASSES)},
                "history": history,
            },
            f,
            indent=2,
        )

    print("\n" + "=" * 70)
    print(f"[DONE] Best validation accuracy : {best_val_acc * 100:.2f}%")
    print(f"[DONE] Model saved              : {MODEL_SAVE}")
    print(f"[DONE] History saved            : {history_path}")
    print("=" * 70)
    print()
    print("Next step:")
    print("  python app.py        ← start backend (classifier auto-loads)")


# ── Entry point ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train thermal leopard binary classifier")
    parser.add_argument("--force-prep", action="store_true",
                        help="Re-split dataset even if prepared_classifier_dataset/ already exists")
    args = parser.parse_args()

    print("=" * 70)
    print("Thermal Leopard Binary Classifier — Training")
    print(f"Dataset : {DATASET_DIR}  (leopard: {CLASSES[0]}, nonleopard: {CLASSES[1]})")
    print(f"Device  : {DEVICE}")
    print("=" * 70 + "\n")

    MODEL_SAVE.parent.mkdir(parents=True, exist_ok=True)

    if args.force_prep and PREPARED_DIR.exists():
        shutil.rmtree(PREPARED_DIR)
        print(f"[PREP] Removed old split at '{PREPARED_DIR}'")

    train()
