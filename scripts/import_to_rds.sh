#!/bin/bash
# Run this on EC2 after uploading sus_data_export.sql and uploads folder
# Usage: bash import_to_rds.sh

RDS_HOST="YOUR_RDS_ENDPOINT"   # replace with your actual RDS endpoint
RDS_USER="sus_user"
RDS_PASS="SusDB2024"
RDS_DB="sus_db"

echo "Installing PostgreSQL client..."
sudo dnf install -y postgresql15

echo "Importing database..."
PGPASSWORD=$RDS_PASS psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f /home/ec2-user/sus_data_export.sql

echo "Done! Database imported successfully."
