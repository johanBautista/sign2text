#!/usr/bin/env python3
"""
entrenar.py - Entrena clasificador desde dataset.json, exporta modelo para navegador.

Uso:
    python3 entrenar.py

Requiere: pip3 install scikit-learn numpy joblib
"""

import json
import os
import sys
import warnings
import numpy as np
from collections import Counter

warnings.filterwarnings("ignore")

DATA_PATH = os.path.join(os.path.dirname(__file__), "src", "assets", "dataset.json")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "public", "model")

try:
    from sklearn.neural_network import MLPClassifier
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, confusion_matrix
    from sklearn.preprocessing import LabelEncoder
    import joblib
except ImportError:
    print("=" * 50)
    print("FALTA: Instalá las dependencias primero")
    print("=" * 50)
    print("  pip3 install scikit-learn numpy joblib")
    print("=" * 50)
    sys.exit(1)

# ── 1. Cargar datos ──────────────────────────────────────────────
print("=" * 50)
print("  ENTRENAMIENTO - Sign2Text")
print("=" * 50)

if not os.path.exists(DATA_PATH):
    print(f"\nERROR: No se encuentra {DATA_PATH}")
    print("Exportá el dataset desde la app primero (pestaña Dataset)")
    sys.exit(1)

with open(DATA_PATH) as f:
    data = json.load(f)

samples = data["samples"]
X = np.array([s["features"] for s in samples], dtype=np.float32)
y_raw = [s["label"] for s in samples]

le = LabelEncoder()
y = le.fit_transform(y_raw)

n_classes = len(le.classes_)
print(f"\n  Muestras: {len(samples)}")
print(f"  Features: {X.shape[1]} (21 landmarks x 3)")
print(f"  Letras:   {', '.join(le.classes_)}")
for l in sorted(le.classes_):
    print(f"    {l}: {y_raw.count(l)}")

# ── 2. Train / Test split ────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
print(f"\n  Train: {len(X_train)}  |  Test: {len(X_test)}")

# ── 3. Random Forest (benchmark) ─────────────────────────────────
print("\n  [1/2] Entrenando Random Forest...")
rf = RandomForestClassifier(n_estimators=200, max_depth=20, random_state=42)
rf.fit(X_train, y_train)
rf_acc = rf.score(X_test, y_test)

y_pred_rf = rf.predict(X_test)
print(f"  → Accuracy: {rf_acc:.1%}")

# ── 4. MLP (red neuronal liviana) ────────────────────────────────
print("\n  [2/2] Entrenando red neuronal...")

model = MLPClassifier(
    hidden_layer_sizes=(64, 32),
    activation="relu",
    max_iter=500,
    random_state=42,
    early_stopping=True,
    validation_fraction=0.1,
    verbose=False,
)
model.fit(X_train, y_train)
nn_acc = model.score(X_test, y_test)
print(f"  → Accuracy: {nn_acc:.1%}")

# ── 5. Reporte por letra ─────────────────────────────────────────
y_pred_nn = model.predict(X_test)

print("\n" + "-" * 50)
print("  REPORTE POR LETRA (red neuronal)")
print("-" * 50)
print(f"  {'Letra':>6} {'Aciertos':>10} {'Total':>8} {'%':>8}")
print("  " + "-" * 32)
for i, letter in enumerate(le.classes_):
    mask = y_test == i
    total = mask.sum()
    correct = (y_pred_nn[mask] == y_test[mask]).sum()
    pct = correct / total if total > 0 else 0
    print(f"  {letter:>6} {correct:>6}/{total:<5} {pct:>7.0%}")

print("\n  Resumen:")
print(f"    Random Forest: {rf_acc:.1%}")
print(f"    Red Neuronal:  {nn_acc:.1%}")

# ── 6. Exportar modelo para navegador ────────────────────────────
os.makedirs(OUTPUT_DIR, exist_ok=True)

export = {
    "coefs": [w.tolist() for w in model.coefs_],
    "intercepts": [b.tolist() for b in model.intercepts_],
    "classes": le.classes_.tolist(),
}

model_path = os.path.join(OUTPUT_DIR, "model.json")
with open(model_path, "w") as f:
    json.dump(export, f)

print(f"\n  ✓ Modelo exportado a: public/model/model.json")
print(f"  ✓ Peso: {os.path.getsize(model_path) / 1024:.1f} KB")
print(f"  ✓ Clases ({len(le.classes_)}): {', '.join(le.classes_)}")

# Guardar label encoder (por si se necesita después para reentrenar)
joblib.dump(le, os.path.join(OUTPUT_DIR, "label_encoder.pkl"))

# Matriz de confusión (para diagnóstico)
cm = confusion_matrix(y_test, y_pred_nn)
print("\n  Matriz de confusión (filas=real, columnas=predicho):")
print("  " + "     " + " ".join(f"{l:>4}" for l in le.classes_))
for i, letter in enumerate(le.classes_):
    row = " ".join(f"{cm[i][j]:4d}" for j in range(n_classes))
    print(f"  {letter:>4}  {row}")

print("\n" + "=" * 50)
print("  LISTO. Ahora actualizá la app para usar el modelo.")
print("=" * 50)
