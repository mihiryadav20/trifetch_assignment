# preprocess.py
# Run once: python preprocess.py
# It will create processed/ecg/*.npy and processed/manifest.db → instant loading forever

import os
import json
import numpy as np
import sqlite3
from pathlib import Path

# ================== CHANGE ONLY THIS LINE ==================
RAW_ROOT = Path("/home/mihir-yadav/Downloads/test-trifetch")
# ===========================================================

PROCESSED_ROOT = Path("processed")
ECG_DIR = PROCESSED_ROOT / "ecg"
ECG_DIR.mkdir(parents=True, exist_ok=True)

# Create SQLite database
conn = sqlite3.connect(PROCESSED_ROOT / "manifest.db")
cur = conn.cursor()
cur.execute("""CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    patient_id TEXT,
    event_name TEXT,
    is_rejected INTEGER,
    start_sample INTEGER,
    ecg_path TEXT
)""")
cur.execute("DELETE FROM events")  # Fresh start every run

total = 0
for json_path in RAW_ROOT.rglob("event_*.json"):
    total += 1
    event_folder = json_path.parent
    event_id = event_folder.name  # folder name is the event ID

    print(f"[{total}] Processing event {event_id}...", end=" ")

    # Load JSON metadata
    with open(json_path, "r") as f:
        meta = json.load(f)

    # ────── Get start_sample (supports both formats) ──────
    if "EventIndex" in meta and meta["EventIndex"] not in (None, "", "null"):
        start_sample = int(meta["EventIndex"])
        print(f"EventIndex={start_sample}", end=" ")
    else:
        # Fallback: calculate from EventOccuredTime
        time_str = meta["EventOccuredTime"].split()[1]  # e.g., "15:42:21.203"
        h, m, s = time_str.split(":")
        seconds = int(h) * 3600 + int(m) * 60 + float(s)
        start_sample = int(seconds * 200)
        print(f"calculated {start_sample} from time", end=" ")

    # Other metadata
    event_name = meta.get("Event_Name", "UNKNOWN") or "UNKNOWN"
    is_rejected = int(meta.get("IsRejected", "0"))
    patient_id = meta.get("Patient_IR_ID", "")

    # ────── Load and concatenate the three .txt files ──────
    ecg_chunks = []
    txt_files = sorted(event_folder.glob("*.txt"))
    if len(txt_files) != 3:
        print(f"Warning: found {len(txt_files)} .txt files, skipping")
        continue

    for txt_file in txt_files:
        chunk = np.loadtxt(txt_file, delimiter=",", dtype=np.int16)
        if chunk.shape[0] != 6000:
            print(f"Warning: {txt_file.name} has {chunk.shape[0]} lines, expected 6000")
        ecg_chunks.append(chunk)

    full_ecg = np.vstack(ecg_chunks)  # Shape: (18000, 2)
    if full_ecg.shape != (18000, 2):
        print(f"Warning: wrong shape {full_ecg.shape}, skipping")
        continue

    # ────── Save as super-fast .npy ──────
    npy_path = ECG_DIR / f"{event_id}.npy"
    np.save(npy_path, full_ecg.astype(np.float32))

    # ────── Insert into SQLite ──────
    cur.execute("""
        INSERT INTO events (event_id, patient_id, event_name, is_rejected, start_sample, ecg_path)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (event_id, patient_id, event_name, is_rejected, start_sample, str(npy_path)))

    print("→ done")

conn.commit()
conn.close()
print(f"\n🎉 SUCCESS! Processed {total} episodes.")
print("   Your backend is now lightning-fast and ready for FastAPI!")
print("   Run your FastAPI server — everything will feel instant 🚀")