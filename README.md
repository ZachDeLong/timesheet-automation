# TimeTrack: Enterprise Timesheet Automation

A full-stack automated "Cheat Sheet" generator designed to bridge the gap between daily productivity tracking and legacy Enterprise Project Management (PPM) systems.

## Problem
Corporate PPM systems often require manual entry of project hours at the end of the week. This leads to:
* Inaccurate data recall
* Time wasted
* Frustration

## Solution
**TimeTrack** is a dashboard that allows for real-time tracking and one-click export to a formatted Excel file that matches the corporate system's schema.

### Features
* **Smart Parsing:** Maps complex Project IDs to human-readable task descriptions.
* **Excel Engine:** Python-based engine (`openpyxl`) generates formatting and timestamped spreadsheets.
* **Local Persistence:** Browser-based storage (`localStorage`) for custom user-defined categories and tasks.

## Stack
* **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
* **Backend:** Python, FastAPI, Uvicorn
* **Data Processing:** Pandas, OpenPyXL
* **State Management:** Local Storage + React Hooks

## Setup

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR_USERNAME/timesheet-automation.git](https://github.com/YOUR_USERNAME/timesheet-automation.git)
cd timesheet-automation
```

### 2. Frontend + Config Setup (React)
```bash
cd frontend
npm install

# Create your local config file for project codes
# (constants.ts is git-ignored; constants.example.ts is the template)
cp app/constants.example.ts app/constants.ts

# Start the frontend dev server (keep this running)
npm run dev
# Frontend runs at: http://localhost:3000
```

### 3. Backend Setup (Python / FastAPI)
Open a **NEW** terminal window or tab, then run from the project root:

```bash
# Return to root if inside frontend/
cd ..

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install backend dependencies
pip install fastapi uvicorn openpyxl pydantic

# Start the backend server (keep this running)
python3 -m uvicorn api:app --reload
# Backend runs at: [http://127.0.0.1:8000](http://127.0.0.1:8000)
```
