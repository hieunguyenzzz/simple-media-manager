#!/bin/bash

# Simple Media Manager - File Upload Script
# This script uploads a file to the media manager API and copies the share link to clipboard

# ============================================
# CONFIGURATION - Update these values
# ============================================
API_URL="http://localhost:3000"
# Get your token by logging in: curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"your@email.com","password":"yourpassword"}'
AUTH_TOKEN="YOUR_AUTH_TOKEN_HERE"

# ============================================
# Script Logic - No need to modify below
# ============================================

# Check if file argument is provided
if [ -z "$1" ]; then
    osascript -e 'display notification "No file provided" with title "Media Manager" subtitle "Error"'
    exit 1
fi

FILE_PATH="$1"

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    osascript -e 'display notification "File not found" with title "Media Manager" subtitle "Error"'
    exit 1
fi

# Get the file extension and determine MIME type
FILENAME=$(basename "$FILE_PATH")
EXTENSION="${FILENAME##*.}"
EXTENSION_LOWER=$(echo "$EXTENSION" | tr '[:upper:]' '[:lower:]')

case "$EXTENSION_LOWER" in
    jpg|jpeg) MIME_TYPE="image/jpeg" ;;
    png) MIME_TYPE="image/png" ;;
    gif) MIME_TYPE="image/gif" ;;
    webp) MIME_TYPE="image/webp" ;;
    svg) MIME_TYPE="image/svg+xml" ;;
    mp4) MIME_TYPE="video/mp4" ;;
    webm) MIME_TYPE="video/webm" ;;
    ogg) MIME_TYPE="video/ogg" ;;
    mov) MIME_TYPE="video/quicktime" ;;
    *)
        osascript -e 'display notification "Unsupported file type: '"$EXTENSION"'" with title "Media Manager" subtitle "Error"'
        exit 1
        ;;
esac

# Show uploading notification
osascript -e 'display notification "Uploading '"$FILENAME"'..." with title "Media Manager"'

# Upload the file
RESPONSE=$(curl -s -X POST "${API_URL}/api/media" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -F "file=@${FILE_PATH};type=${MIME_TYPE}")

# Check if upload was successful
if echo "$RESPONSE" | grep -q '"shareLink"'; then
    # Extract the share link using Python (more reliable than sed/grep for JSON)
    SHARE_LINK=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['shareLink'])" 2>/dev/null)

    if [ -n "$SHARE_LINK" ]; then
        # Copy to clipboard
        echo -n "$SHARE_LINK" | pbcopy

        # Show success notification
        osascript -e 'display notification "Link copied to clipboard!" with title "Media Manager" subtitle "Upload successful"'

        # Optionally open in browser (uncomment if desired)
        # open "$SHARE_LINK"

        exit 0
    fi
fi

# If we get here, something went wrong
ERROR_MSG=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', 'Unknown error'))" 2>/dev/null || echo "Upload failed")
osascript -e 'display notification "'"$ERROR_MSG"'" with title "Media Manager" subtitle "Error"'
exit 1
