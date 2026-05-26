#!/bin/bash
# =============================================================
# SUS Auto-Deploy Script
# Runs on EC2 after GitHub Actions uploads the new build files.
# Features: zero-downtime swap, health check, auto-rollback.
# =============================================================

set -e  # exit on any error

DEPLOY_DIR="/home/ec2-user/deployments"
BACKEND_LIVE="/home/ec2-user/app/backend"
FRONTEND_LIVE="/home/ec2-user/app/frontend"
BACKUP_DIR="/home/ec2-user/backups"
LOG_FILE="/home/ec2-user/deployments/deploy.log"
BACKEND_PORT=8090
FRONTEND_PORT=3000
HEALTH_RETRIES=20
HEALTH_INTERVAL=5   # seconds between each health check attempt

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log()  { echo "[$(timestamp)] $*" | tee -a "$LOG_FILE"; }
fail() { log "❌ ERROR: $*"; exit 1; }

log "======================================================"
log " SUS Deploy started"
log "======================================================"

# ── Ensure directories exist ──────────────────────────────────
mkdir -p "$BACKEND_LIVE" "$FRONTEND_LIVE" "$BACKUP_DIR"

# ── Step 1: Backup current backend JAR ───────────────────────
if [ -f "$BACKEND_LIVE/sus-backend.jar" ]; then
    log "📦 Backing up current backend JAR..."
    cp "$BACKEND_LIVE/sus-backend.jar" "$BACKUP_DIR/sus-backend.jar.bak"
fi

# ── Step 2: Backup current frontend ──────────────────────────
if [ -d "$FRONTEND_LIVE/.next" ]; then
    log "📦 Backing up current frontend..."
    rm -rf "$BACKUP_DIR/frontend-bak"
    cp -r "$FRONTEND_LIVE" "$BACKUP_DIR/frontend-bak"
fi

# ── Step 3: Install new backend JAR ──────────────────────────
log "📥 Installing new backend JAR..."
cp "$DEPLOY_DIR/sus-backend-new.jar" "$BACKEND_LIVE/sus-backend.jar"
chmod 644 "$BACKEND_LIVE/sus-backend.jar"

# ── Step 4: Install new frontend ─────────────────────────────
log "📥 Extracting new frontend build..."
cd "$FRONTEND_LIVE"
tar -xzf "$DEPLOY_DIR/frontend-build.tar.gz"
log "✅ Frontend extracted"

# ── Step 5: Update systemd service to point to new JAR ───────
log "🔄 Restarting backend service..."
sudo systemctl restart sus-backend

# ── Step 6: Health check — backend ───────────────────────────
log "⏳ Waiting for backend to become healthy..."
BACKEND_OK=false
for i in $(seq 1 $HEALTH_RETRIES); do
    if curl -sf "http://localhost:$BACKEND_PORT/api/actuator/health" | grep -q '"status":"UP"'; then
        log "✅ Backend healthy (attempt $i)"
        BACKEND_OK=true
        break
    fi
    log "   Backend not ready yet (attempt $i/$HEALTH_RETRIES)..."
    sleep $HEALTH_INTERVAL
done

if [ "$BACKEND_OK" = false ]; then
    log "❌ Backend failed health check — rolling back..."
    rollback_backend
    fail "Backend did not start. Rolled back to previous version."
fi

# ── Step 7: Restart frontend ──────────────────────────────────
log "🔄 Restarting frontend service..."
sudo systemctl restart sus-frontend

# ── Step 8: Health check — frontend ──────────────────────────
log "⏳ Waiting for frontend to become healthy..."
FRONTEND_OK=false
for i in $(seq 1 $HEALTH_RETRIES); do
    STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" || echo "000")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
        log "✅ Frontend healthy — HTTP $STATUS (attempt $i)"
        FRONTEND_OK=true
        break
    fi
    log "   Frontend not ready yet — HTTP $STATUS (attempt $i/$HEALTH_RETRIES)..."
    sleep $HEALTH_INTERVAL
done

if [ "$FRONTEND_OK" = false ]; then
    log "❌ Frontend failed health check — rolling back..."
    rollback_frontend
    fail "Frontend did not start. Rolled back to previous version."
fi

# ── Step 9: Clean up old deploy artifacts ────────────────────
log "🧹 Cleaning up deploy artifacts..."
rm -f "$DEPLOY_DIR/sus-backend-new.jar"
rm -f "$DEPLOY_DIR/frontend-build.tar.gz"

log "======================================================"
log " ✅ Deployment complete!"
log "======================================================"

# ─────────────────────────────────────────────────────────────
# Rollback functions (called on failure)
# ─────────────────────────────────────────────────────────────

rollback_backend() {
    if [ -f "$BACKUP_DIR/sus-backend.jar.bak" ]; then
        log "⏪ Rolling back backend to previous JAR..."
        cp "$BACKUP_DIR/sus-backend.jar.bak" "$BACKEND_LIVE/sus-backend.jar"
        sudo systemctl restart sus-backend
        sleep 10
        if curl -sf "http://localhost:$BACKEND_PORT/api/actuator/health" | grep -q '"status":"UP"'; then
            log "✅ Rollback successful — previous backend is running"
        else
            log "⚠️  Rollback also failed — manual intervention required"
        fi
    else
        log "⚠️  No backup found — cannot roll back backend"
    fi
}

rollback_frontend() {
    if [ -d "$BACKUP_DIR/frontend-bak" ]; then
        log "⏪ Rolling back frontend to previous build..."
        rm -rf "$FRONTEND_LIVE"
        cp -r "$BACKUP_DIR/frontend-bak" "$FRONTEND_LIVE"
        sudo systemctl restart sus-frontend
        log "✅ Frontend rollback done"
    else
        log "⚠️  No backup found — cannot roll back frontend"
    fi
}
