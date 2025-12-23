#!/bin/bash
# Script to reset the database

cd "$(dirname "$0")"

if [ -f "contracts.db" ]; then
    rm contracts.db
    echo "✓ Database file 'contracts.db' has been deleted."
    echo "The database will be automatically recreated when you start the server."
else
    echo "Database file 'contracts.db' not found. Nothing to delete."
fi

# Optional: Also remove uploaded files (uncomment if you want to delete uploads too)
# if [ -d "uploads" ]; then
#     find uploads -type f ! -name ".gitkeep" -delete
#     echo "✓ Uploaded files have been deleted."
# fi


