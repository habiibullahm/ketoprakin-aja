#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-bot-vps}"
APP_DIR="/opt/ketoprakin-aja"
COMPOSE_FILE="docker-compose.vps.yml"

cd "$(dirname "$0")/.."
commit="$(git rev-parse --short HEAD)"
echo "==> kirim $commit ke $HOST:$APP_DIR"
git archive --format=tar HEAD | ssh -o BatchMode=yes "$HOST" \
  "sudo mkdir -p $APP_DIR && sudo tar -x -C $APP_DIR -f - && sudo chown -R deploy:deploy $APP_DIR"

echo "==> rebuild API + Socket.IO + frontend"
ssh -o BatchMode=yes "$HOST" \
  "cd $APP_DIR && test -f .env && sudo docker compose -f $COMPOSE_FILE up -d --build --force-recreate"

echo "==> health check"
ssh -o BatchMode=yes "$HOST" \
  "sleep 8; sudo docker compose -f $APP_DIR/$COMPOSE_FILE ps; curl -fsS http://127.0.0.1/health >/dev/null"
echo "==> deploy selesai"
