#!/bin/bash
set -e

DEPLOY_DIR="/home/ec2-user/deployments"
BACKEND_LIVE="/home/ec2-user/app/backend"
FRONTEND_LIVE="/home/ec2-user/app/frontend"
BACKUP_DIR="/home/ec2-user/backups"
LOG_FILE="/home/ec2-user/deployments/deploy.log"
BACKEND_PORT=8090
FRONTEND_PORT=3000
HEALTH_RETRIES=20
HEALTH_INTERVAL=5

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log()  { echo "[$(timestamp)] $*" | tee -a "$LOG_FILE"; }
fail() { log "ERROR: $*"; exit 1; }

rollback_backend() {
    if [ -f "$BACKUP_DIR/sus-backend.jar.bak" ]; then
        log "Rolling back backend..."
        cp "$BACKUP_DIR/sus-backend.jar.bak" "$BACKEND_LIVE/sus-backend.jar"
        sudo systemctl restart sus-backend
        log "Rollback done"
    fi
}

rollback_frontend() {
    if [ -d "$BACKUP_DIR/frontend-bak" ]; then
        log "Rolling back frontend..."
        rm -rf "$FRONTEND_LIVE"
        cp -r "$BACKUP_DIR/frontend-bak" "$FRONTEND_LIVE"
        sudo systemctl restart sus-frontend
        log "Frontend rollback done"
    fi
}

log "======================================================"
log " SUS Deploy started"
log "======================================================"

mkdir -p "$BACKEND_LIVE" "$FRONTEND_LIVE" "$BACKUP_DIR"

if [ -f "$BACKEND_LIVE/sus-backend.jar" ]; then
    log "Backing up current backend JAR..."
    cp "$BACKEND_LIVE/sus-backend.jar" "$BACKUP_DIR/sus-backend.jar.bak"
fi

if [ -d "$FRONTEND_LIVE/.next" ]; then
    log "Backing up current frontend..."
    rm -rf "$BACKUP_DIR/frontend-bak"
    cp -r "$FRONTEND_LIVE" "$BACKUP_DIR/frontend-bak"
fi

log "Installing new backend JAR..."
cp "$DEPLOY_DIR/sus-backend-new.jar" "$BACKEND_LIVE/sus-backend.jar"
chmod 644 "$BACKEND_LIVE/sus-backend.jar"

log "Writing production config overrides..."
cat > "$BACKEND_LIVE/application.yml" << 'EOF'
app:
  frontend-url: http://3.7.177.41
  base-url: http://3.7.177.41
EOF

log "Extracting new frontend build..."
cd "$FRONTEND_LIVE"
tar -xzf "$DEPLOY_DIR/frontend-build.tar.gz"
log "Frontend extracted"

log "Restarting backend service..."
sudo systemctl restart sus-backend

log "Waiting for backend to become healthy..."
BACKEND_OK=false
for i in $(seq 1 $HEALTH_RETRIES); do
    STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:$BACKEND_PORT/ || echo "000")
    if echo "$STATUS" | grep -qE "200|401|403"; then
        log "Backend healthy - HTTP $STATUS (attempt $i)"
        BACKEND_OK=true
        break
    fi
    log "Backend not ready yet - HTTP $STATUS (attempt $i/$HEALTH_RETRIES)..."
    sleep $HEALTH_INTERVAL
done

if [ "$BACKEND_OK" = false ]; then
    log "Backend failed health check - rolling back..."
    rollback_backend
    fail "Backend did not start."
fi

log "Restarting frontend service..."
sudo systemctl restart sus-frontend

log "Waiting for frontend to become healthy..."
FRONTEND_OK=false
for i in $(seq 1 $HEALTH_RETRIES); do
    STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" || echo "000")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
        log "Frontend healthy - HTTP $STATUS (attempt $i)"
        FRONTEND_OK=true
        break
    fi
    log "Frontend not ready yet - HTTP $STATUS (attempt $i/$HEALTH_RETRIES)..."
    sleep $HEALTH_INTERVAL
done

if [ "$FRONTEND_OK" = false ]; then
    log "Frontend failed health check - rolling back..."
    rollback_frontend
    fail "Frontend did not start."
fi

log "Fixing upload directory permissions for nginx..."
chmod o+x /home/ec2-user /home/ec2-user/app /home/ec2-user/app/backend
chmod -R o+r "$BACKEND_LIVE/uploads/" 2>/dev/null || true
find "$BACKEND_LIVE/uploads/" -type d -exec chmod o+x {} \; 2>/dev/null || true

log "Cleaning up..."
rm -f "$DEPLOY_DIR/sus-backend-new.jar"
rm -f "$DEPLOY_DIR/frontend-build.tar.gz"

log "======================================================"
log " Deployment complete!"
log "======================================================"
