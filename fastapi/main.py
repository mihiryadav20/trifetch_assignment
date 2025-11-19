# main.py  (updated for the new patient-centric flow)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import numpy as np
from pathlib import Path
from pydantic import BaseModel
from typing import List

app = FastAPI(title="TriFetch - Patient View")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

DB_PATH = Path("processed/manifest.db")

# Helper: get DB connection
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# 1. NEW: Landing page - list of unique patients
@app.get("/patients")
def get_patients():
    conn = get_db()
    rows = conn.execute("""
        SELECT patient_id, COUNT(*) as episode_count
        FROM events 
        GROUP BY patient_id 
        ORDER BY patient_id
    """).fetchall()
    conn.close()
    return [{"patient_id": row["patient_id"], "episode_count": row["episode_count"]} for row in rows]

# 2. NEW: Click patient → list their episodes
@app.get("/patient/{patient_id}/episodes")
def get_patient_episodes(patient_id: str):
    conn = get_db()
    rows = conn.execute("""
        SELECT event_id, event_name, is_rejected, start_sample 
        FROM events 
        WHERE patient_id = ? 
        ORDER BY event_id
    """, (patient_id,)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

# 3. Existing: Click episode → full ECG (unchanged, just even faster now)
@app.get("/event/{event_id}")
def get_event(event_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM events WHERE event_id = ?", (event_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Event not found")
    row = dict(row)

    ecg_full = np.load(row["ecg_path"])
    ecg_display = ecg_full[::4]  # 4x downsample

    return {
        "event_id": event_id,
        "patient_id": row["patient_id"],
        "ground_truth": row["event_name"],
        "is_rejected": bool(row["is_rejected"]),
        "ecg": ecg_display.tolist(),
        "time_seconds": [i/50 for i in range(len(ecg_display))],
        "start_sample_display": row["start_sample"] // 4,
        "predicted": row["event_name"],  # replace with your classifier later
        "confidence": 0.98
    }