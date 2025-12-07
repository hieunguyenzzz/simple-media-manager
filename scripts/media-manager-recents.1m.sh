#!/bin/bash

# Simple Media Manager - SwiftBar Menu Bar Plugin
# Shows the last 20 shared files with clickable links
# Filename format: media-manager-recents.{refresh_time}.sh (e.g., 1m = every minute)

# ============================================
# CONFIGURATION - Update these values
# ============================================
API_URL="https://media.hieunguyen.dev"
AUTH_TOKEN="YOUR_AUTH_TOKEN_HERE"

# ============================================
# Script Logic - No need to modify below
# ============================================

# Menu bar icon (camera emoji)
echo "📷"
echo "---"

# Fetch recent media from API
RESPONSE=$(curl -s -X GET "${API_URL}/api/media?limit=20" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json" 2>/dev/null)

# Check if request was successful
if [ -z "$RESPONSE" ]; then
    echo "Error: Could not connect | color=red"
    exit 0
fi

# Check for error in response
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    ERROR=$(echo "$RESPONSE" | jq -r '.error')
    echo "Error: $ERROR | color=red"
    exit 0
fi

# Parse and display media items
MEDIA_COUNT=$(echo "$RESPONSE" | jq -r '.media | length' 2>/dev/null)

if [ "$MEDIA_COUNT" = "0" ] || [ -z "$MEDIA_COUNT" ]; then
    echo "No uploads yet"
    exit 0
fi

echo "Recent Uploads ($MEDIA_COUNT) | size=12"
echo "---"

# Loop through each media item
echo "$RESPONSE" | jq -r '.media[] | "\(.originalName)|\(.id)|\(.type)|\(.createdAt)"' 2>/dev/null | while IFS='|' read -r name id type created; do
    # Truncate long filenames
    if [ ${#name} -gt 40 ]; then
        display_name="${name:0:37}..."
    else
        display_name="$name"
    fi

    # Icon based on type
    if [ "$type" = "IMAGE" ]; then
        icon="🖼"
    else
        icon="🎬"
    fi

    # Format date (extract just the date part)
    date_part=$(echo "$created" | cut -d'T' -f1)

    # Share link
    share_link="${API_URL}/v/${id}"

    # Menu item: click to copy link, cmd+click to open in browser
    echo "$icon $display_name | bash='echo -n \"$share_link\" | pbcopy' terminal=false refresh=false"
    echo "-- 📋 Copy link | bash='echo -n \"$share_link\" | pbcopy' terminal=false"
    echo "-- 🌐 Open in browser | href=$share_link"
    echo "-- 📅 $date_part | disabled=true"
done

echo "---"
echo "🔄 Refresh | refresh=true"
echo "⚙️ Open Media Manager | href=${API_URL}"
