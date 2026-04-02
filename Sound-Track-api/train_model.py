from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

import librosa
import numpy as np
import tensorflow as tf
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from tensorflow import keras

from app.services.audio_preprocessing import (
    SAMPLE_RATE,
    TARGET_SAMPLES,
    extract_features,
    fix_feature_width,
    normalize_features,
)


CLASS_NAMES = ["leopard", "non_leopard"]
CLASS_TO_INDEX = {name: index for index, name in enumerate(CLASS_NAMES)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train leopard sound classifier")
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=Path("detaset"),
        help="Path to dataset directory containing leopard/ and non_leopard/ folders",
    )
    parser.add_argument(
        "--model-output",
        type=Path,
        default=Path("model") / "best_leopard_model.h5",
        help="Where to save the best trained model",
    )
    parser.add_argument(
        "--metrics-output",
        type=Path,
        default=Path("model") / "training_metrics.json",
        help="Where to save evaluation metrics",
    )
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--augment-per-window",
        type=int,
        default=2,
        help="Number of augmented variants to create for each training window",
    )
    return parser.parse_args()


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)


def pad_or_trim(audio: np.ndarray) -> np.ndarray:
    if len(audio) < TARGET_SAMPLES:
        audio = np.pad(audio, (0, TARGET_SAMPLES - len(audio)), mode="constant")
    else:
        audio = audio[:TARGET_SAMPLES]
    return audio.astype(np.float32)


def feature_from_audio(audio: np.ndarray) -> np.ndarray:
    features = extract_features(audio)
    features = normalize_features(features)
    features = fix_feature_width(features)
    return np.expand_dims(features, axis=-1).astype(np.float32)


def random_gain(audio: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    gain = rng.uniform(0.75, 1.25)
    return np.clip(audio * gain, -1.0, 1.0).astype(np.float32)


def random_noise(audio: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    noise_level = rng.uniform(0.001, 0.01)
    noise = rng.normal(0.0, noise_level, size=len(audio)).astype(np.float32)
    return np.clip(audio + noise, -1.0, 1.0).astype(np.float32)


def random_shift(audio: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    shift = int(rng.integers(-SAMPLE_RATE // 5, SAMPLE_RATE // 5))
    return np.roll(audio, shift).astype(np.float32)


def random_time_stretch(audio: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    rate = float(rng.uniform(0.9, 1.1))
    stretched = librosa.effects.time_stretch(audio, rate=rate)
    return pad_or_trim(stretched)


def random_pitch_shift(audio: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    steps = float(rng.uniform(-1.0, 1.0))
    shifted = librosa.effects.pitch_shift(audio, sr=SAMPLE_RATE, n_steps=steps)
    return pad_or_trim(shifted)


def augment_audio(audio: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    augmented = audio.copy()
    transforms = [
        random_gain,
        random_noise,
        random_shift,
        random_time_stretch,
        random_pitch_shift,
    ]
    rng.shuffle(transforms)

    num_transforms = int(rng.integers(2, 4))
    for transform in transforms[:num_transforms]:
        augmented = transform(augmented, rng)

    return pad_or_trim(augmented)


def load_audio_file(path: Path) -> np.ndarray:
    audio, _ = librosa.load(str(path), sr=SAMPLE_RATE, mono=True)
    audio, _ = librosa.effects.trim(audio, top_db=20)

    if audio.size > 0:
        audio = librosa.util.normalize(audio)

    return audio.astype(np.float32)


def split_into_windows(audio: np.ndarray) -> list[np.ndarray]:
    if audio.size == 0:
        return []

    windows: list[np.ndarray] = []
    total_samples = len(audio)
    start = 0
    chunk_index = 0

    while start < total_samples:
        end = start + TARGET_SAMPLES
        chunk = audio[start:end]

        if len(chunk) == 0:
            break

        if len(chunk) < TARGET_SAMPLES and chunk_index > 0:
            break

        windows.append(pad_or_trim(chunk))
        start = end
        chunk_index += 1

    return windows


def collect_files(dataset_dir: Path) -> list[tuple[Path, int]]:
    file_entries: list[tuple[Path, int]] = []

    for class_name in CLASS_NAMES:
        class_dir = dataset_dir / class_name
        if not class_dir.exists():
            raise FileNotFoundError(f"Missing dataset folder: {class_dir}")

        for path in sorted(class_dir.iterdir()):
            if path.is_file():
                file_entries.append((path, CLASS_TO_INDEX[class_name]))

    if not file_entries:
        raise ValueError(f"No dataset files found in {dataset_dir}")

    return file_entries


def split_files(
    file_entries: list[tuple[Path, int]],
    seed: int,
) -> tuple[list[tuple[Path, int]], list[tuple[Path, int]], list[tuple[Path, int]]]:
    labels = [label for _, label in file_entries]

    train_files, temp_files = train_test_split(
        file_entries,
        test_size=0.30,
        random_state=seed,
        stratify=labels,
    )

    temp_labels = [label for _, label in temp_files]
    val_files, test_files = train_test_split(
        temp_files,
        test_size=0.50,
        random_state=seed,
        stratify=temp_labels,
    )

    return train_files, val_files, test_files


def build_dataset(
    split_files: list[tuple[Path, int]],
    *,
    augment_per_window: int = 0,
    seed: int = 42,
) -> tuple[np.ndarray, np.ndarray, int]:
    features: list[np.ndarray] = []
    labels: list[int] = []
    skipped_files = 0
    rng = np.random.default_rng(seed)

    for file_path, label in split_files:
        try:
            audio = load_audio_file(file_path)
            windows = split_into_windows(audio)
        except Exception as exc:
            skipped_files += 1
            print(f"Skipping {file_path.name}: {exc}")
            continue

        if not windows:
            skipped_files += 1
            continue

        for window in windows:
            try:
                features.append(feature_from_audio(window))
                labels.append(label)

                for _ in range(augment_per_window):
                    features.append(feature_from_audio(augment_audio(window, rng)))
                    labels.append(label)
            except Exception as exc:
                print(f"Skipping window from {file_path.name}: {exc}")

    if not features:
        raise ValueError("No usable samples were created from the dataset")

    return np.stack(features), np.asarray(labels, dtype=np.int32), skipped_files


def build_model(input_shape: tuple[int, int, int]) -> keras.Model:
    inputs = keras.Input(shape=input_shape)

    x = keras.layers.Conv2D(32, (3, 3), padding="same")(inputs)
    x = keras.layers.BatchNormalization()(x)
    x = keras.layers.Activation("relu")(x)
    x = keras.layers.MaxPooling2D((2, 2))(x)
    x = keras.layers.Dropout(0.20)(x)

    x = keras.layers.Conv2D(64, (3, 3), padding="same")(x)
    x = keras.layers.BatchNormalization()(x)
    x = keras.layers.Activation("relu")(x)
    x = keras.layers.MaxPooling2D((2, 2))(x)
    x = keras.layers.Dropout(0.25)(x)

    x = keras.layers.Conv2D(128, (3, 3), padding="same")(x)
    x = keras.layers.BatchNormalization()(x)
    x = keras.layers.Activation("relu")(x)
    x = keras.layers.MaxPooling2D((2, 2))(x)
    x = keras.layers.Dropout(0.30)(x)

    x = keras.layers.GlobalAveragePooling2D()(x)
    x = keras.layers.Dense(128, activation="relu")(x)
    x = keras.layers.Dropout(0.30)(x)
    outputs = keras.layers.Dense(len(CLASS_NAMES), activation="softmax")(x)

    model = keras.Model(inputs=inputs, outputs=outputs)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def to_serializable_class_report(report: dict) -> dict:
    serializable: dict[str, object] = {}
    for key, value in report.items():
        if isinstance(value, dict):
            serializable[key] = {
                metric_name: float(metric_value)
                for metric_name, metric_value in value.items()
            }
        elif isinstance(value, (float, int, np.floating, np.integer)):
            serializable[key] = float(value)
        else:
            serializable[key] = value
    return serializable


def main() -> None:
    args = parse_args()
    seed_everything(args.seed)

    dataset_dir = args.dataset_dir.resolve()
    model_output = args.model_output.resolve()
    metrics_output = args.metrics_output.resolve()
    model_output.parent.mkdir(parents=True, exist_ok=True)
    metrics_output.parent.mkdir(parents=True, exist_ok=True)

    file_entries = collect_files(dataset_dir)
    train_files, val_files, test_files = split_files(file_entries, seed=args.seed)

    x_train, y_train, skipped_train = build_dataset(
        train_files,
        augment_per_window=args.augment_per_window,
        seed=args.seed,
    )
    x_val, y_val, skipped_val = build_dataset(val_files)
    x_test, y_test, skipped_test = build_dataset(test_files)

    class_weights = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(y_train),
        y=y_train,
    )
    class_weight_dict = {
        int(class_index): float(weight)
        for class_index, weight in zip(np.unique(y_train), class_weights, strict=True)
    }

    model = build_model(input_shape=x_train.shape[1:])

    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=5,
            restore_best_weights=True,
        ),
        keras.callbacks.ModelCheckpoint(
            filepath=str(model_output),
            monitor="val_accuracy",
            save_best_only=True,
            mode="max",
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=2,
            min_lr=1e-5,
        ),
    ]

    history = model.fit(
        x_train,
        y_train,
        validation_data=(x_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1,
    )

    best_model = keras.models.load_model(model_output)
    test_loss, test_accuracy = best_model.evaluate(x_test, y_test, verbose=0)

    probabilities = best_model.predict(x_test, verbose=0)
    predictions = np.argmax(probabilities, axis=1)

    class_report = classification_report(
        y_test,
        predictions,
        target_names=CLASS_NAMES,
        output_dict=True,
        zero_division=0,
    )
    confusion = confusion_matrix(y_test, predictions).tolist()

    metrics = {
        "dataset_dir": str(dataset_dir),
        "class_names": CLASS_NAMES,
        "file_counts": {
            "total": len(file_entries),
            "train": len(train_files),
            "validation": len(val_files),
            "test": len(test_files),
        },
        "window_counts": {
            "train": int(len(y_train)),
            "validation": int(len(y_val)),
            "test": int(len(y_test)),
        },
        "augmentation": {
            "augment_per_window": args.augment_per_window,
        },
        "skipped_files": {
            "train": skipped_train,
            "validation": skipped_val,
            "test": skipped_test,
        },
        "test_metrics": {
            "loss": float(test_loss),
            "accuracy": float(test_accuracy),
            "accuracy_sklearn": float(accuracy_score(y_test, predictions)),
        },
        "classification_report": to_serializable_class_report(class_report),
        "confusion_matrix": confusion,
        "history": {
            key: [float(value) for value in values]
            for key, values in history.history.items()
        },
    }

    metrics_output.write_text(json.dumps(metrics, indent=2))

    print("\nTraining complete")
    print(f"Saved best model to: {model_output}")
    print(f"Saved metrics to: {metrics_output}")
    print(f"Test accuracy: {metrics['test_metrics']['accuracy']:.4f}")
    print("Confusion matrix:")
    for row in confusion:
        print(row)


if __name__ == "__main__":
    main()
