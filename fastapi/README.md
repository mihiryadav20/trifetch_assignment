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
