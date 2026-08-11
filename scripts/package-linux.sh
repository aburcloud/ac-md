#!/bin/bash
# AburMD Linux Packaging Script (AppImage & .deb)
set -euo pipefail

echo "========================================"
echo "      Packaging AburMD for Linux       "
echo "========================================"

if [ ! -f "./bin/aburmd" ]; then
  bash ./scripts/build-linux.sh
fi

echo "Creating AppDir structure..."
APPDIR="./bin/AburMD.AppDir"
mkdir -p "$APPDIR/usr/bin"
mkdir -p "$APPDIR/usr/share/applications"

cp ./bin/aburmd "$APPDIR/usr/bin/"
cp ./packaging/linux/aburmd.desktop "$APPDIR/"
cp ./packaging/linux/aburmd.desktop "$APPDIR/usr/share/applications/"

echo "AppDir layout created at $APPDIR"
echo "Use appimagetool to produce final AburMD-1.0.0-linux-x86_64.AppImage"
