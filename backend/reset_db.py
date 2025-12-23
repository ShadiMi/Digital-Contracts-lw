#!/usr/bin/env python3
"""
Script to reset the database by deleting the database file.
The database will be automatically recreated when you start the server.
"""

import os
from pathlib import Path

# Get the database path
DB_PATH = Path("contracts.db")

if DB_PATH.exists():
    os.remove(DB_PATH)
    print(f"✓ Database file '{DB_PATH}' has been deleted.")
    print("The database will be automatically recreated when you start the server.")
else:
    print(f"Database file '{DB_PATH}' not found. Nothing to delete.")


