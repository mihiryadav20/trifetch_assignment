"""
TriFetch API - Patient-Centric ECG Event Viewer

This API provides a three-tier navigation system:
1. View all patients
2. View episodes for a specific patient
3. View detailed ECG data for a specific episode
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import List, Dict, Any
import sqlite3
import numpy as np


# ============================================================================
# Configuration
# ============================================================================

DB_PATH = Path("processed/manifest.db")
DOWNSAMPLE_FACTOR = 4  # Reduce 200 Hz to 50 Hz for display
ORIGINAL_SAMPLE_RATE = 200  # Hz
DISPLAY_SAMPLE_RATE = ORIGINAL_SAMPLE_RATE // DOWNSAMPLE_FACTOR  # 50 Hz


# ============================================================================
# FastAPI Application Setup
# ============================================================================

app = FastAPI(
    title="TriFetch - Patient View",
    description="ECG cardiac event monitoring and analysis system",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Database Utilities
# ============================================================================

def get_db() -> sqlite3.Connection:
    """
    Create and return a database connection with Row factory.
    
    Returns:
        sqlite3.Connection: Database connection with row_factory enabled
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/patients", response_model=List[Dict[str, Any]])
def get_patients():
    """
    Get list of all patients with their episode counts.
    
    Returns:
        List of patients with:
        - patient_id: Unique patient identifier
        - episode_count: Number of cardiac events for this patient
    """
    conn = get_db()
    rows = conn.execute("""
        SELECT patient_id, COUNT(*) as episode_count
        FROM events 
        GROUP BY patient_id 
        ORDER BY patient_id
    """).fetchall()
    conn.close()
    
    return [
        {
            "patient_id": row["patient_id"], 
            "episode_count": row["episode_count"]
        } 
        for row in rows
    ]


@app.get("/patient/{patient_id}/episodes", response_model=List[Dict[str, Any]])
def get_patient_episodes(patient_id: str):
    """
    Get all cardiac episodes for a specific patient.
    
    Args:
        patient_id: Unique patient identifier
        
    Returns:
        List of episodes with event details (ID, name, rejection status, timing)
    """
    conn = get_db()
    rows = conn.execute("""
        SELECT event_id, event_name, is_rejected, start_sample 
        FROM events 
        WHERE patient_id = ? 
        ORDER BY event_id
    """, (patient_id,)).fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


@app.get("/event/{event_id}", response_model=Dict[str, Any])
def get_event(event_id: str):
    """
    Get detailed ECG data for a specific cardiac event.
    
    Args:
        event_id: Unique event identifier
        
    Returns:
        Complete event data including:
        - Patient and event metadata
        - Downsampled ECG waveform data (2 channels)
        - Timing information
        - Ground truth diagnosis
        - ML prediction (placeholder)
        
    Raises:
        HTTPException: 404 if event not found
    """
    # Fetch event metadata from database
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM events WHERE event_id = ?", 
        (event_id,)
    ).fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    
    row = dict(row)
    
    # Load and downsample ECG data
    ecg_full = np.load(row["ecg_path"])  # Shape: (18000, 2)
    ecg_display = ecg_full[::DOWNSAMPLE_FACTOR]  # Shape: (4500, 2)
    
    # Calculate time axis for display
    num_samples = len(ecg_display)
    time_seconds = [i / DISPLAY_SAMPLE_RATE for i in range(num_samples)]
    
    return {
        "event_id": event_id,
        "patient_id": row["patient_id"],
        "ground_truth": row["event_name"],
        "is_rejected": bool(row["is_rejected"]),
        "ecg": ecg_display.tolist(),  # [[ch1, ch2], [ch1, ch2], ...]
        "time_seconds": time_seconds,
        "start_sample_display": row["start_sample"] // DOWNSAMPLE_FACTOR,
        "predicted": row["event_name"],  # TODO: Replace with ML classifier
        "confidence": 0.98  # TODO: Replace with actual confidence score
    }