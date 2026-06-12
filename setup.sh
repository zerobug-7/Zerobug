#!/bin/bash

echo "================================================"
echo "        ZEROBUG BOT - AUTO INSTALLER"
echo "================================================"

echo ""
echo "[1/8] Setting up Termux storage..."
termux-setup-storage

echo ""
echo "[2/8] Updating packages..."
pkg update && pkg upgrade -y

echo ""
echo "[3/8] Installing required packages..."
pkg install nodejs-lts -y
pkg install npm -y
pkg install git -y
pkg install ffmpeg -y
pkg install imagemagick -y

echo ""
echo "[4/8] Cloning Zerobug repo..."
git clone https://github.com/zerobug-7/Zerobug
cd Zerobug

echo ""
echo "[5/8] Installing node modules..."
npm install --legacy-peer-deps

echo ""
echo "[6/8] Installing missing dependencies..."
npm install @hapi/boom --legacy-peer-deps
npm install --legacy-peer-deps --ignore-scripts

echo ""
echo "[7/8] Patching sharp for Android..."
grep -rl "require('sharp')" commands/ | xargs sed -i "s/const sharp = require('sharp')/let sharp; try { sharp = require('sharp') } catch(e) { sharp = null }/g"

echo ""
echo "[8/8] Setup complete! Starting bot..."
echo "================================================"
echo "        ZEROBUG BOT IS STARTING..."
echo "================================================"
node index.js
