# TriFetch API Documentation

This document provides the necessary information for building a frontend application that interacts with the TriFetch API. The API allows for a three-tier navigation system to view patient and cardiac event data.

## Base URL

All endpoints are relative to the base URL where the FastAPI application is running.

Example: `http://127.0.0.1:8000`

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

### 3. Get Event Details

- **HTTP Method:** `GET`
- **Path:** `/event/{event_id}`
- **Description:** Retrieves comprehensive data for a single cardiac event, including downsampled ECG waveform data for visualization. This is the third and most detailed tier of navigation.
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
      "confidence": 0.98
    }
    ```
- **Error Response:**
  - **Code:** `404 Not Found`
  - **Content:**
    ```json
    {
      "detail": "Event not found"
    }
    ```
