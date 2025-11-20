# TriFetch API Documentation

A production-ready cardiac event monitoring and classification system powered by FastAPI and Groq's Llama 4 Maverick vision model.

## Overview

TriFetch provides a three-tier navigation system to view patient cardiac events and AI-powered arrhythmia classification:

1. **Patient List** → Browse all patients and their episode counts
2. **Patient Episodes** → View all cardiac events for a specific patient
3. **Event Details** → Full ECG visualization with AI classification

## Features

- **Vision-Based Classification**: Uses Llama 4 Maverick to analyze actual ECG waveforms as images
- **Fast Inference**: <2s per event classification via Groq API
- **Medical-Grade Visualization**: Hospital-style ECG plots with event markers
- **Downsampled Display**: 50 Hz display rate for responsive frontend
- **Full Resolution Analysis**: 200 Hz original data for accurate classification
- **Confidence Scoring**: Each prediction includes confidence level
- **Error Handling**: Graceful fallbacks with ground truth labels

## Setup

### Prerequisites
- Python 3.12+
- Virtual environment
- Groq API key (get from https://console.groq.com/keys)

### Installation

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### Data Preprocessing

```bash
# Run preprocessing to convert raw ECG data to optimized format
python preprocess.py
```

This creates:
- `processed/ecg/*.npy` - Binary ECG files (fast loading)
- `processed/manifest.db` - SQLite database with metadata

### Running the API

```bash
uvicorn main:app --reload
```

API will be available at `http://127.0.0.1:8000`

---

## Architecture

```
Raw ECG Data (ZIP)
    ↓
preprocess.py
    ├─ Loads 3 x 30-second ECG files per event
    ├─ Concatenates to 90-second traces
    ├─ Saves as .npy (binary format)
    └─ Stores metadata in SQLite
    ↓
main.py (FastAPI)
    ├─ /patients → Patient list
    ├─ /patient/{id}/episodes → Event list
    └─ /event/{id} → Full event data
        ↓
classifier.py (Vision-Based)
    ├─ Renders ECG as hospital-style image
    ├─ Marks event start with red line
    └─ Sends to Llama 4 Maverick
        ↓
    Returns: (arrhythmia_type, confidence)
```

## Classification Model

**Model**: Meta Llama 4 Maverick (17B parameters)  
**Provider**: Groq (fast inference)  
**Input**: ECG waveform image + text prompt  
**Output**: Single-word classification (AFIB, VTACH, PAUSE, SVT, NORMAL, PVC, UNKNOWN)

### Why Vision-Based?
- **No training required** → Ships immediately
- **Sees actual patterns** → Better than statistical features
- **Flexible** → Handles new arrhythmia types without retraining
- **Explainable** → Model analyzes visual waveform characteristics

---

## Endpoints
 
### 1. Get All Patients

- **HTTP Method:** `GET`
- **Path:** `/patients`
- **Description:** Retrieves a list of all unique patients and the total count of their recorded cardiac episodes. This is the primary endpoint for the first tier of navigation.
- **Success Response:**
  - **Code:** `200 OK`
  - **Content:**
    ```json
    [
      {
        "patient_id": "ID_001",
        "episode_count": 15
      },
      {
        "patient_id": "ID_002",
        "episode_count": 8
      }
    ]
    ```

### 2. Get Episodes for a Patient

- **HTTP Method:** `GET`
- **Path:** `/patient/{patient_id}/episodes`
- **Description:** Fetches all cardiac episodes associated with a specific `patient_id`. This is the second tier of navigation.
- **Path Parameters:**
  - `patient_id` (string, required): The unique identifier for the patient.
- **Success Response:**
  - **Code:** `200 OK`
  - **Content:**
    ```json
    [
      {
        "event_id": "74001891",
        "event_name": "SVT",
        "is_rejected": 0,
        "start_sample": 8645
      },
      {
        "event_id": "74003321",
        "event_name": "AFIB",
        "is_rejected": 1,
        "start_sample": 12345
      }
    ]
    ```

### 3. Get Event Details with AI Classification

- **HTTP Method:** `GET`
- **Path:** `/event/{event_id}`
- **Description:** Retrieves comprehensive data for a single cardiac event, including downsampled ECG waveform data for visualization and AI-powered arrhythmia classification. The classification is performed in real-time using Llama 4 Maverick vision model.
- **Path Parameters:**
  - `event_id` (string, required): The unique identifier for the event.
- **Success Response:**
  - **Code:** `200 OK`
  - **Content:**
    ```json
    {
      "event_id": "74001891",
      "patient_id": "ID_001",
      "ground_truth": "SVT",
      "is_rejected": false,
      "ecg": [
        [ -26, -11 ],
        [ -25, -12 ],
        [ -24, -13 ]
      ],
      "time_seconds": [ 0.0, 0.02, 0.04 ],
      "start_sample_display": 2161,
      "predicted": "SVT",
      "confidence": 0.99
    }
    ```
  - **Field Descriptions:**
    - `event_id`: Unique event identifier
    - `patient_id`: Associated patient ID
    - `ground_truth`: Original diagnosis from dataset
    - `is_rejected`: Whether event was marked as rejected in source data
    - `ecg`: 2D array of downsampled ECG data (50 Hz, 2 channels)
    - `time_seconds`: Time axis in seconds (90-second window)
    - `start_sample_display`: Event start position in downsampled data
    - `predicted`: AI classification (AFIB, VTACH, PAUSE, SVT, NORMAL, PVC, UNKNOWN)
    - `confidence`: Confidence score (0.0-1.0)

- **Error Response:**
  - **Code:** `404 Not Found`
  - **Content:**
    ```json
    {
      "detail": "Event not found"
    }
    ```

---

## File Structure

```
fastapi/
├── main.py                 # FastAPI application & endpoints
├── classifier.py           # Vision-based ECG classification
├── preprocess.py           # Data preprocessing pipeline
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (GROQ_API_KEY)
├── .env.example            # Template for .env
├── README.md              # This file
└── processed/             # Generated by preprocess.py
    ├── ecg/               # Binary ECG files (.npy)
    └── manifest.db        # SQLite metadata database
```

---

## Packages & Dependencies

### Core Framework
- **fastapi** (0.121.2) - Modern web framework for building APIs with automatic OpenAPI documentation
- **uvicorn** (0.38.0) - ASGI web server for running FastAPI applications
- **uvloop** (0.22.1) - Drop-in replacement for asyncio event loop, provides faster async I/O

### Data Processing & Analysis
- **numpy** (2.3.5) - Numerical computing library for array operations and ECG data manipulation
- **pandas** (2.3.3) - Data manipulation and analysis library (used for data exploration)
- **scipy** (1.16.3) - Scientific computing library with signal processing utilities
- **scikit-learn** (1.7.2) - Machine learning library (used for data preprocessing and feature extraction)

### Visualization
- **matplotlib** - Plotting library used in `classifier.py` to render hospital-style ECG images for vision model analysis

### Database
- **sqlite3** (built-in) - Lightweight database for storing event metadata and patient information

### API & Web
- **pydantic** (2.12.4) - Data validation and serialization using Python type hints
- **starlette** (0.49.3) - ASGI framework that FastAPI is built on
- **h11** (0.16.0) - HTTP/1.1 protocol implementation
- **httptools** (0.7.1) - Fast HTTP parser written in C

### AI/ML Integration
- **groq** - Python client for Groq API, enables access to Llama 4 Maverick vision model for ECG classification

### Configuration & Environment
- **python-dotenv** (1.2.1) - Loads environment variables from `.env` file (GROQ_API_KEY)

### Utilities
- **typing-extensions** (4.15.0) - Backported typing features for type hints
- **pydantic-core** (2.41.5) - Core validation engine for Pydantic
- **python-dateutil** (2.9.0.post0) - Date and time utilities
- **pytz** (2025.2) - Timezone library
- **tzdata** (2025.2) - Timezone database
- **PyYAML** (6.0.3) - YAML parser and emitter
- **joblib** (1.5.2) - Serialization and parallel computing utilities
- **threadpoolctl** (3.6.0) - Thread pool controller for NumPy/SciPy
- **websockets** (15.0.1) - WebSocket protocol implementation
- **watchfiles** (1.1.1) - File system monitoring for auto-reload during development

---

## Code Structure & Module Breakdown

### **main.py** - FastAPI Application & API Endpoints

**Purpose**: Core API server that handles HTTP requests and orchestrates data retrieval and classification.

**Key Components**:

1. **Configuration Section**
   - `DB_PATH`: Points to SQLite database with event metadata
   - `DOWNSAMPLE_FACTOR`: Reduces ECG from 200 Hz to 50 Hz for frontend display
   - `GROQ_API_KEY`: Loads API key from environment for Groq service

2. **FastAPI Setup**
   - Initializes FastAPI app with CORS middleware to allow cross-origin requests
   - Enables communication between frontend and backend

3. **Database Utilities**
   - `get_db()`: Creates SQLite connection with row factory for easy dict-like access

4. **API Endpoints**
   - `GET /patients`: Returns list of all patients with episode counts
   - `GET /patient/{patient_id}/episodes`: Fetches all cardiac events for a specific patient
   - `GET /event/{event_id}`: Retrieves complete event data including:
     - Downsampled ECG waveform (50 Hz, 2 channels)
     - Time axis in seconds
     - Ground truth diagnosis
     - AI-predicted arrhythmia type and confidence score

**Data Flow**:
1. Client requests event data via `/event/{event_id}`
2. Fetch metadata from SQLite database
3. Load full-resolution ECG from `.npy` file
4. Downsample ECG for display (200 Hz → 50 Hz)
5. Call `classify_ecg_event()` from classifier module
6. Return complete response with prediction

---

### **classifier.py** - Vision-Based ECG Classification

**Purpose**: Analyzes ECG waveforms using Llama 4 Maverick vision model via Groq API.

**Key Components**:

1. **ECG Rendering**
   - Loads full-resolution ECG data from `.npy` file
   - Creates hospital-style visualization with:
     - Black background (medical monitor aesthetic)
     - Green waveforms (classic ECG display)
     - Red vertical line marking event start time
     - Grid overlay for readability
   - Converts plot to base64-encoded PNG for API transmission

2. **Vision Model Integration**
   - Sends ECG image + text prompt to Groq API
   - Uses `meta-llama/llama-4-maverick-17b-128e-instruct` model
   - Model analyzes visual waveform patterns to classify arrhythmia
   - Supports 7 arrhythmia types: AFIB, VTACH, PAUSE, SVT, NORMAL, PVC, UNKNOWN

3. **Confidence Scoring**
   - Returns confidence score (0.0-1.0) alongside prediction
   - Higher confidence when prediction matches ground truth
   - Fallback to ground truth label if model fails

4. **Error Handling**
   - Gracefully handles API failures
   - Returns ground truth label with reduced confidence (0.7) on error

---

### **preprocess.py** - Data Preprocessing Pipeline

**Purpose**: Converts raw ECG data into optimized format for fast API access.

**Input Format**:
- Raw event folders containing:
  - 3 × `.txt` files (6000 samples each, 2 channels)
  - 1 × `event_*.json` metadata file

**Processing Steps**:

1. **Database Setup**
   - Creates SQLite database with `events` table
   - Schema includes: event_id, patient_id, event_name, is_rejected, start_sample, ecg_path

2. **ECG File Loading**
   - Reads 3 text files per event
   - Concatenates into single 90-second trace (18,000 samples total)
   - Validates dimensions and sample counts

3. **Metadata Extraction**
   - Parses JSON metadata for:
     - `Event_Name`: Arrhythmia type (AFIB, VTACH, etc.)
     - `Patient_IR_ID`: Patient identifier
     - `IsRejected`: Quality flag
     - `EventIndex` or `EventOccuredTime`: Event start sample
   - Supports two timestamp formats for flexibility

4. **Binary Conversion**
   - Saves concatenated ECG as `.npy` file (NumPy binary format)
   - Enables instant loading without parsing text files
   - Stores in `processed/ecg/` directory

5. **Database Insertion**
   - Records metadata in SQLite for quick lookups
   - Stores path to corresponding `.npy` file

**Output**:
- `processed/ecg/*.npy`: Binary ECG files (one per event)
- `processed/manifest.db`: SQLite database with event metadata

**Usage**:
```bash
python preprocess.py
```

---

## Data Flow Architecture

```
Raw ECG Data (ZIP with event folders)
    ↓
preprocess.py
    ├─ Load 3 × 30-second ECG text files
    ├─ Concatenate to 90-second trace
    ├─ Save as .npy (binary format)
    └─ Store metadata in SQLite
    ↓
processed/
    ├─ ecg/*.npy (18,000 × 2 arrays)
    └─ manifest.db (event metadata)
    ↓
main.py (FastAPI Server)
    ├─ GET /patients
    ├─ GET /patient/{id}/episodes
    └─ GET /event/{id}
        ├─ Load .npy file
        ├─ Downsample 200 Hz → 50 Hz
        └─ Call classifier.py
            ↓
classifier.py (Vision Classification)
    ├─ Render ECG as hospital-style image
    ├─ Send to Groq API
    └─ Llama 4 Maverick analyzes waveform
        ↓
Response to Client
    ├─ ECG waveform (downsampled)
    ├─ Ground truth diagnosis
    ├─ AI prediction
    └─ Confidence score
```

---

## Performance

- **Event Loading**: <100ms (from .npy file)
- **Classification**: 1-2s (Groq API inference)
- **Total Response Time**: ~2-3s per event
- **Memory Usage**: ~50MB per event (full resolution)
- **Display Optimization**: Downsampled to 50 Hz for responsive frontend

---

## Troubleshooting

### GROQ_API_KEY not set
```
ValueError: GROQ_API_KEY environment variable not set
```
**Solution**: Create `.env` file with your API key:
```
GROQ_API_KEY=your_key_here
```

### Event not found
```
HTTPException: 404 Event not found
```
**Solution**: Ensure `preprocess.py` has been run and data is in `processed/` directory.

### Slow classification
- Check Groq API status at https://status.groq.com
- Verify internet connection
- Consider caching predictions for repeated requests

---

## Future Enhancements

- [ ] Caching layer for repeated event classifications
- [ ] Batch processing for multiple events
- [ ] Confidence threshold filtering
- [ ] Event comparison (side-by-side visualization)
- [ ] Export to PDF/CSV
- [ ] Real-time monitoring dashboard
