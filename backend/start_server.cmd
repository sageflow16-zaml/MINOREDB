@echo off
cd /d C:\Users\elhao\OneDrive\Desktop\Project_Minore\backend
set PYTHONPATH=C:\Users\elhao\OneDrive\Desktop\Project_Minore\backend
".venv\Scripts\python.exe" -m uvicorn src.main:app --host 127.0.0.1 --port 8000
