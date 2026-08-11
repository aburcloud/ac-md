#!/bin/bash
# AburMD Linux Build Script
set -euo pipefail

echo "========================================"
echo "        Building AburMD Linux Binary    "
echo "========================================"

OUTPUT_DIR="./bin"
mkdir -p "$OUTPUT_DIR"

echo "Compiling aburmd with Go..."
go build -ldflags="-s -w" -o "$OUTPUT_DIR/aburmd" ./cmd/aburmd

echo "Successfully built Linux executable: $OUTPUT_DIR/aburmd"
