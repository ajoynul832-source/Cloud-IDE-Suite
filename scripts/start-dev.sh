#!/bin/bash
# Start both API server and Cloud IDE in development
set -e

echo "[dev] Starting API Server on port 8080..."
PORT=8080 pnpm --filter @workspace/api-server run dev &
API_PID=$!

echo "[dev] Starting Cloud IDE on port 21471..."
PORT=21471 BASE_PATH=/ide/ pnpm --filter @workspace/cloud-ide run dev &
IDE_PID=$!

# Forward signals to children
trap "kill $API_PID $IDE_PID 2>/dev/null; exit 0" SIGTERM SIGINT

wait $API_PID $IDE_PID
