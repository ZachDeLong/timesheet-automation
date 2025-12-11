from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import excel_engine
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- NEW Data Models ---
class ProjectEntry(BaseModel):
    name: str
    monday: float = 0
    tuesday: float = 0
    wednesday: float = 0
    thursday: float = 0
    friday: float = 0
    saturday: float = 0
    sunday: float = 0

class TimesheetData(BaseModel):
    employee_name: str
    projects: List[ProjectEntry]

@app.post("/export-timesheet")
async def generate_timesheet(data: TimesheetData):
    data_dict = data.model_dump()
    result_message = excel_engine.export_timesheet(data_dict)
    
    print(f"DEBUG: Engine returned -> {result_message}")

    if "Error" in result_message:
        raise HTTPException(status_code=400, detail=result_message)
    
    file_path = result_message.replace("Success! Saved to ", "")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail="File generated but not found on server.")

    return FileResponse(
        path=file_path, 
        filename=os.path.basename(file_path),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
