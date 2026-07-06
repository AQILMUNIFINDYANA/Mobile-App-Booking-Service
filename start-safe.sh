#!/bin/bash

# macOS Expo file limit fix
# This script temporarily increases the file descriptor limit for the current shell session

echo "🔧 Increasing file descriptor limit..."

# Get current limits
CURRENT=$(ulimit -n)
echo "Current limit: $CURRENT"

# Try to set higher limit (soft limit)
ulimit -n 10000 2>/dev/null
NEW_LIMIT=$(ulimit -n)
echo "New limit: $NEW_LIMIT"

# Start Expo with single worker and other optimizations
echo ""
echo "🚀 Starting Expo..."
cd /Users/nathangtg/esgul-service-pro

# Set environment variables to reduce file watching overhead
export EXPO_NO_TYPESCRIPT_SETUP=1
export EXPO_OFFLINE_MODE=0

# Start with optimizations
exec npm start -- --max-workers=1
