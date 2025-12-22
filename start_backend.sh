#!/bin/bash

cd backend
python -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload


