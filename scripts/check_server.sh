#!/bin/bash
# Run this on EC2 to check deployment status
# Usage: bash check_server.sh

RDS_HOST="YOUR_RDS_ENDPOINT"
RDS_USER="sus_user"
RDS_PASS="SusDB2024"
RDS_DB="sus_db"

echo "====== 1. SERVICE STATUS ======"
sudo systemctl status sus-backend --no-pager | head -5
sudo systemctl status sus-frontend --no-pager | head -5
sudo systemctl status nginx --no-pager | head -3

echo ""
echo "====== 2. BACKEND HEALTH ======"
curl -s http://localhost:8090/api/actuator/health 2>/dev/null || echo "Backend not responding"

echo ""
echo "====== 3. FRONTEND HEALTH ======"
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000 || echo "Frontend not responding"

echo ""
echo "====== 4. DATABASE RECORD COUNTS ======"
PGPASSWORD=$RDS_PASS psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -c "
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'Schools', COUNT(*) FROM schools
UNION ALL SELECT 'Products', COUNT(*) FROM products
UNION ALL SELECT 'Categories', COUNT(*) FROM categories
UNION ALL SELECT 'Product Images', COUNT(*) FROM product_images
UNION ALL SELECT 'Orders', COUNT(*) FROM orders;
" 2>/dev/null || echo "Cannot connect to RDS"

echo ""
echo "====== 5. UPLOADS FOLDER ======"
ls /home/ec2-user/app/backend/uploads/ 2>/dev/null | wc -l | xargs echo "Image files:"
ls /home/ec2-user/uploads/ 2>/dev/null | wc -l | xargs echo "Image files (alt path):"

echo ""
echo "====== 6. APP CONFIG ======"
cat /home/ec2-user/app/backend/application-prod.properties 2>/dev/null | grep -v password || echo "No prod config found"

echo ""
echo "====== 7. BACKEND LOGS (last 20 lines) ======"
sudo journalctl -u sus-backend -n 20 --no-pager
