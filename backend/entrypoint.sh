#!/bin/bash
set -e

echo ">>> Attente de MySQL ($DB_HOST)..."
MAX_RETRIES=30
RETRY_COUNT=0
while ! python -c "
import MySQLdb
import sys
try:
    conn = MySQLdb.connect(host='$DB_HOST', user='$DB_USER', passwd='$DB_PASSWORD', db='$DB_NAME')
    conn.close()
    print('OK')
    sys.exit(0)
except Exception as e:
    print(f'Erreur: {e}')
    sys.exit(1)
" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo ">>> ERREUR: MySQL n'est pas accessible après $MAX_RETRIES tentatives"
    exit 1
  fi
  sleep 2
done
echo ">>> MySQL prêt."

echo ">>> Migrations..."
python manage.py migrate --noinput

echo ">>> Collectstatic..."
python manage.py collectstatic --noinput || true

echo ">>> Démarrage Gunicorn..."
exec gunicorn Lebougui.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -