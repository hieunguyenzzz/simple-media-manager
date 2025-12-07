# macOS Quick Share Setup Guide

This guide will help you set up two features on a new Mac:

1. **Quick Share Action** - Right-click any image/video to upload and get a share link
2. **Menu Bar App** - View your last 20 uploads from the menu bar

---

## Prerequisites

Install Homebrew (if not already installed):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install required dependencies:
```bash
brew install jq
brew install --cask swiftbar
```

---

## Step 1: Get Your Auth Token

Log in to get your authentication token:

```bash
curl -X POST https://media.hieunguyen.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

Copy the `token` value from the response. You'll need this for both scripts.

---

## Part 1: Quick Share Action

### Step 2: Create the Upload Script

Create the scripts directory and file:

```bash
mkdir -p ~/bin
nano ~/bin/upload-to-media-manager.sh
```

Paste the following script (update `API_URL` and `AUTH_TOKEN` with your values):

```bash
#!/bin/bash

# Simple Media Manager - File Upload Script
# This script uploads a file to the media manager API and copies the share link to clipboard

# ============================================
# CONFIGURATION - Update these values
# ============================================
API_URL="https://media.hieunguyen.dev"
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
```

Make it executable:

```bash
chmod +x ~/bin/upload-to-media-manager.sh
```

### Step 3: Create the Quick Action in Automator

1. Open **Automator** (press `Cmd+Space`, type "Automator")

2. Click **File** → **New** (or press `Cmd+N`)

3. Select **Quick Action** and click **Choose**

4. At the top, configure:
   - **Workflow receives current**: `files or folders`
   - **in**: `any application`

5. In the left sidebar, search for "Run Shell Script" and drag it to the workflow area

6. Configure the shell script:
   - **Shell**: `/bin/bash`
   - **Pass input**: `as arguments`
   - Replace the script content with:

```bash
for f in "$@"
do
    "$HOME/bin/upload-to-media-manager.sh" "$f"
done
```

7. Save (`Cmd+S`) and name it: `Share to Media Manager`

### Step 4: Test the Quick Action

1. Right-click any image or video file in Finder
2. Go to **Quick Actions** → **Share to Media Manager**
3. Wait for the notification
4. The share link is now in your clipboard!

---

## Part 2: Menu Bar App (SwiftBar)

### Step 5: Create the Menu Bar Script

Create the SwiftBar plugins directory:

```bash
mkdir -p ~/Library/Application\ Support/SwiftBar/Plugins
nano ~/Library/Application\ Support/SwiftBar/Plugins/media-manager-recents.1m.sh
```

Paste the following script (update `API_URL` and `AUTH_TOKEN` with your values):

```bash
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
```

Make it executable:

```bash
chmod +x ~/Library/Application\ Support/SwiftBar/Plugins/media-manager-recents.1m.sh
```

### Step 6: Launch SwiftBar

1. Open **SwiftBar** from Applications (or Spotlight)
2. When prompted for plugins folder, select:
   ```
   ~/Library/Application Support/SwiftBar/Plugins
   ```
3. You should see a 📷 camera icon in your menu bar

### Using the Menu Bar App

- Click the 📷 icon to see your last 20 uploads
- Click any file name to **copy its share link**
- Use the submenu to open in browser
- The list refreshes automatically every minute

---

## Troubleshooting

### Quick Action not appearing
1. Go to **System Settings** → **Privacy & Security** → **Extensions** → **Finder**
2. Enable "Share to Media Manager"
3. You may need to log out and back in

### "Error: Not authenticated"
Your auth token may have expired. Get a new one from Step 1.

### "Error: Unsupported file type"
Supported formats:
- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Videos**: MP4, WebM, OGG, MOV

### Menu bar icon not appearing
1. Make sure SwiftBar is running
2. Check script permissions:
   ```bash
   chmod +x ~/Library/Application\ Support/SwiftBar/Plugins/media-manager-recents.1m.sh
   ```

### Script permission denied
```bash
chmod +x ~/bin/upload-to-media-manager.sh
```

---

## Optional: Keyboard Shortcut

Assign a keyboard shortcut to the Quick Action:

1. Go to **System Settings** → **Keyboard** → **Keyboard Shortcuts**
2. Select **Services** in the sidebar
3. Find "Share to Media Manager" under **Files and Folders**
4. Click and press your desired shortcut (e.g., `Cmd+Shift+U`)

---

## Quick Reference

| Feature | How to Use |
|---------|-----------|
| Upload file | Right-click → Quick Actions → Share to Media Manager |
| View recent uploads | Click 📷 in menu bar |
| Copy share link | Click file name in menu bar |
| Open in browser | Click file → Open in browser |
| Refresh list | Click 📷 → Refresh |
