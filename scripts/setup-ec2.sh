#!/bin/bash
# =============================================================
# SUS EC2 One-Time Setup Script
# Run this ONCE on a fresh EC2 instance before first deploy.
# Usage: bash setup-ec2.sh
# =============================================================

set -e
log() { echo "▶ $*"; }

log "Creating required directories..."
mkdir -p /home/ec2-user/app/backend
mkdir -p /home/ec2-user/app/frontend
mkdir -p /home/ec2-user/deployments
mkdir -p /home/ec2-user/backups
mkdir -p /home/ec2-user/uploads

log "Allowing ec2-user to restart services without password prompt..."
echo "ec2-user ALL=(ALL) NOPASSWD: /bin/systemctl restart sus-backend, /bin/systemctl restart sus-frontend, /bin/systemctl status sus-backend, /bin/systemctl status sus-frontend" \
    | sudo tee /etc/sudoers.d/sus-deploy

log "Setup complete. You can now run the deploy script."
