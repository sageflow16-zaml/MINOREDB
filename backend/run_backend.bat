@echo off
cd /d c:\Users\elhao\OneDrive\Desktop\Project_Minore\backend
set PYTHONPATH=c:\Users\elhao\OneDrive\Desktop\Project_Minore\backend
c:\Users\elhao\OneDrive\Desktop\Project_Minore\venv\Scripts\python.exe -m uvicorn src.main:app --host 127.0.0.1 --port 8000 > run.log 2>&1