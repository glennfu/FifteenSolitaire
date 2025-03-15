#!/bin/bash

# Variables
USER="glennfuadmin"
DOMAIN="gamelizard.com"
DIST_STANDALONE_DIR="dist-standalone"
REMOTE_PATH="/home/$USER/$DOMAIN"

# Create necessary directories on the remote server
echo "Creating necessary directories on the remote server..."
ssh $USER@$DOMAIN "mkdir -p $REMOTE_PATH"

# Upload all files from dist-standalone directory
echo "Uploading all files from dist-standalone directory..."
scp -r $DIST_STANDALONE_DIR/* $USER@$DOMAIN:$REMOTE_PATH/

echo "Upload complete!"
echo ""
echo "To install as a PWA on iOS 18.3.2:"
echo "1. Open Safari and navigate to https://$DOMAIN/fifteen-solitaire.html"
echo "2. Tap the Share button (square with arrow pointing up)"
echo "3. Scroll down and tap 'Add to Home Screen'"
echo "4. Tap 'Add' in the top-right corner"
echo ""
echo "The game will now be available as an app on your home screen with the green felt background extending to the status bar!"