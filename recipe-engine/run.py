#!/usr/bin/env python3
"""
MealVista AI Recipe Engine - Entry Point
=========================================
Run with: python run.py
"""
import os
import sys

# Ensure src is on path when running from project root
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

import uvicorn
from api import app

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
