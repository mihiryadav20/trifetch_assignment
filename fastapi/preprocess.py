"""
TriFetch Data Preprocessor

This script processes raw ECG event data and converts it into an optimized format
for fast loading in the TriFetch API.

Input:
- Raw event folders containing:
  * 3 x .txt files (6000 samples each, 2 channels)
  * 1 x event_*.json metadata file

Output:
- processed/ecg/*.npy (binary NumPy arrays for instant loading)
- processed/manifest.db (SQLite database with event metadata)

Usage:
    python preprocess.py
"""

import json
import sqlite3
from pathlib import Path
import numpy as np


# ============================================================================
# Configuration
# ============================================================================

# CHANGE THIS PATH to point to your raw data directory
RAW_ROOT = Path("/home/mihir-yadav/Downloads/test-trifetch")

PROCESSED_ROOT = Path("processed")
ECG_DIR = PROCESSED_ROOT / "ecg"

# ECG data specifications
SAMPLES_PER_FILE = 6000
NUM_FILES_PER_EVENT = 3
TOTAL_SAMPLES = SAMPLES_PER_FILE * NUM_FILES_PER_EVENT  # 18000
NUM_CHANNELS = 2
SAMPLE_RATE = 200  # Hz


# ============================================================================
# Database Setup
# ============================================================================

def setup_database():
    """
    Create the SQLite database and events table.
    Clears existing data for a fresh start.
    
    Returns:
        tuple: (connection, cursor) objects
    """
    ECG_DIR.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(PROCESSED_ROOT / "manifest.db")
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS events (
            event_id TEXT PRIMARY KEY,
            patient_id TEXT,
            event_name TEXT,
            is_rejected INTEGER,
            start_sample INTEGER,
            ecg_path TEXT
        )
    """)
    
    cur.execute("DELETE FROM events")  # Fresh start every run
    
    return conn, cur


# ============================================================================
# Helper Functions
# ============================================================================

def extract_start_sample(metadata: dict) -> int:
    """
    Extract the start sample index from event metadata.
    Supports two formats: EventIndex field or calculated from EventOccuredTime.
    
    Args:
        metadata: Event metadata dictionary from JSON
        
    Returns:
        int: Start sample index
    """
    if "EventIndex" in metadata and metadata["EventIndex"] not in (None, "", "null"):
        return int(metadata["EventIndex"])
    
    # Fallback: calculate from EventOccuredTime
    time_str = metadata["EventOccuredTime"].split()[1]  # e.g., "15:42:21.203"
    h, m, s = time_str.split(":")
    seconds = int(h) * 3600 + int(m) * 60 + float(s)
    return int(seconds * SAMPLE_RATE)


def load_ecg_files(event_folder: Path) -> np.ndarray:
    """
    Load and concatenate the three ECG text files for an event.
    
    Args:
        event_folder: Path to the event folder containing .txt files
        
    Returns:
        np.ndarray: Combined ECG data with shape (18000, 2)
        
    Raises:
        ValueError: If file count or dimensions are incorrect
    """
    txt_files = sorted(event_folder.glob("*.txt"))
    
    if len(txt_files) != NUM_FILES_PER_EVENT:
        raise ValueError(f"Expected {NUM_FILES_PER_EVENT} .txt files, found {len(txt_files)}")
    
    ecg_chunks = []
    for txt_file in txt_files:
        chunk = np.loadtxt(txt_file, delimiter=",", dtype=np.int16)
        if chunk.shape[0] != SAMPLES_PER_FILE:
            print(f"Warning: {txt_file.name} has {chunk.shape[0]} samples, expected {SAMPLES_PER_FILE}")
        ecg_chunks.append(chunk)
    
    full_ecg = np.vstack(ecg_chunks)
    
    if full_ecg.shape != (TOTAL_SAMPLES, NUM_CHANNELS):
        raise ValueError(f"Expected shape ({TOTAL_SAMPLES}, {NUM_CHANNELS}), got {full_ecg.shape}")
    
    return full_ecg


def process_event(json_path: Path, cursor: sqlite3.Cursor, event_number: int) -> bool:
    """
    Process a single event: load data, convert to .npy, and store metadata.
    
    Args:
        json_path: Path to the event JSON metadata file
        cursor: Database cursor for inserting records
        event_number: Sequential event number for logging
        
    Returns:
        bool: True if processing succeeded, False otherwise
    """
    event_folder = json_path.parent
    event_id = event_folder.name
    
    print(f"[{event_number}] Processing event {event_id}...", end=" ")
    
    try:
        # Load metadata
        with open(json_path, "r") as f:
            metadata = json.load(f)
        
        # Extract metadata fields
        start_sample = extract_start_sample(metadata)
        event_name = metadata.get("Event_Name", "UNKNOWN") or "UNKNOWN"
        is_rejected = int(metadata.get("IsRejected", "0"))
        patient_id = metadata.get("Patient_IR_ID", "")
        
        print(f"start={start_sample}", end=" ")
        
        # Load and concatenate ECG files
        full_ecg = load_ecg_files(event_folder)
        
        # Save as binary .npy file for fast loading
        npy_path = ECG_DIR / f"{event_id}.npy"
        np.save(npy_path, full_ecg.astype(np.float32))
        
        # Insert metadata into database
        cursor.execute("""
            INSERT INTO events (event_id, patient_id, event_name, is_rejected, start_sample, ecg_path)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (event_id, patient_id, event_name, is_rejected, start_sample, str(npy_path)))
        
        print("✓ done")
        return True
        
    except Exception as e:
        print(f"✗ failed: {e}")
        return False


# ============================================================================
# Main Processing Loop
# ============================================================================

def main():
    """
    Main preprocessing function: processes all events and creates the database.
    """
    print("=" * 70)
    print("TriFetch Data Preprocessor")
    print("=" * 70)
    print(f"Raw data directory: {RAW_ROOT}")
    print(f"Output directory: {PROCESSED_ROOT}")
    print("=" * 70)
    
    # Setup database
    conn, cur = setup_database()
    
    # Find all event JSON files
    json_files = list(RAW_ROOT.rglob("event_*.json"))
    total_events = len(json_files)
    
    print(f"\nFound {total_events} events to process\n")
    
    # Process each event
    success_count = 0
    for idx, json_path in enumerate(json_files, start=1):
        if process_event(json_path, cur, idx):
            success_count += 1
    
    # Commit and close database
    conn.commit()
    conn.close()
    
    # Print summary
    print("\n" + "=" * 70)
    print(f"🎉 Processing complete!")
    print(f"   Successfully processed: {success_count}/{total_events} events")
    print(f"   Database: {PROCESSED_ROOT / 'manifest.db'}")
    print(f"   ECG files: {ECG_DIR}")
    print("=" * 70)
    print("\n✓ Your backend is ready! Start the FastAPI server with:")
    print("  uvicorn main:app --reload")
    print("=" * 70)


if __name__ == "__main__":
    main()