# macOS Integration Guide

This guide covers two features:
1. **Quick Action** - Right-click to upload files to Media Manager
2. **Menu Bar App** - View your last 20 shared files

## Prerequisites

1. Your Media Manager server is running (locally or deployed)
2. You have an account and auth token
3. Install dependencies:

```bash
brew install jq
brew install --cask swiftbar
```

## Step 1: Get Your Auth Token

Get your authentication token by logging in:

```bash
curl -X POST https://media.hieunguyen.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

Copy the `token` value from the response.

---

# Part 1: Quick Action Setup

Add a "Share to Media Manager" option to your right-click context menu.

## Step 2: Install the Upload Script

```bash
mkdir -p ~/bin
cp scripts/upload-to-media-manager.sh ~/bin/
chmod +x ~/bin/upload-to-media-manager.sh
```

Edit the script to add your configuration:

```bash
nano ~/bin/upload-to-media-manager.sh
```

Update these values at the top:
- `API_URL` - Your media manager URL (e.g., `https://media.hieunguyen.dev`)
- `AUTH_TOKEN` - The token from Step 1

## Step 3: Create the Quick Action in Automator

1. Open **Automator** (search in Spotlight)

2. Click **File** → **New** (or press ⌘N)

3. Select **Quick Action** and click **Choose**

4. Configure the workflow settings at the top:
   - **Workflow receives current**: `files or folders`
   - **in**: `any application`
   - **Image**: Choose an icon (optional, e.g., "Share")

5. From the left sidebar, drag **Run Shell Script** to the workflow area

6. Configure the shell script action:
   - **Shell**: `/bin/bash`
   - **Pass input**: `as arguments`
   - Replace the script content with:

```bash
for f in "$@"
do
    "$HOME/bin/upload-to-media-manager.sh" "$f"
done
```

7. Save the workflow (⌘S) and name it: `Share to Media Manager`

## Step 4: Test the Quick Action

1. Right-click on any image or video file
2. Go to **Quick Actions** → **Share to Media Manager**
3. Wait for the notification
4. The share link is now in your clipboard!

---

# Part 2: Menu Bar App Setup

View your last 20 shared files from the menu bar using SwiftBar.

## Step 5: Install the Menu Bar Plugin

1. Create the SwiftBar plugins directory:

```bash
mkdir -p ~/Library/Application\ Support/SwiftBar/Plugins
```

2. Copy the menu bar script:

```bash
cp scripts/media-manager-recents.1m.sh ~/Library/Application\ Support/SwiftBar/Plugins/
chmod +x ~/Library/Application\ Support/SwiftBar/Plugins/media-manager-recents.1m.sh
```

3. Edit the script to add your configuration:

```bash
nano ~/Library/Application\ Support/SwiftBar/Plugins/media-manager-recents.1m.sh
```

Update the `API_URL` and `AUTH_TOKEN` values.

## Step 6: Launch SwiftBar

1. Open **SwiftBar** from Applications
2. When prompted, select `~/Library/Application Support/SwiftBar/Plugins` as your plugins folder
3. You should see a camera icon in your menu bar

## Using the Menu Bar App

- Click the menu bar icon to see your last 20 uploads
- Click any file name to **copy its share link** to clipboard
- Hold ⌘ and click to **open the link** in your browser
- The list refreshes automatically every minute

---

# Troubleshooting

## Quick Action Issues

### "Error: Not authenticated"
Your auth token may have expired. Get a new one from Step 1.

### "Error: Unsupported file type"
Only these file types are supported:
- Images: JPEG, PNG, GIF, WebP, SVG
- Videos: MP4, WebM, OGG, MOV

### Quick Action not appearing
1. Go to **System Settings** → **Privacy & Security** → **Extensions** → **Finder**
2. Make sure "Share to Media Manager" is checked
3. You may need to log out and back in

### Script permission denied
```bash
chmod +x ~/bin/upload-to-media-manager.sh
```

## Menu Bar Issues

### Icon not appearing
1. Make sure SwiftBar is running (check Applications)
2. Verify the plugin has execute permissions:
```bash
chmod +x ~/Library/Application\ Support/SwiftBar/Plugins/media-manager-recents.1m.sh
```

### "Error fetching" message
- Check your API_URL and AUTH_TOKEN in the script
- Verify your server is accessible

### Plugin not refreshing
- Click the menu bar icon and select "Refresh"
- Or restart SwiftBar

---

# Keyboard Shortcut (Optional)

Assign a keyboard shortcut to the Quick Action:

1. Go to **System Settings** → **Keyboard** → **Keyboard Shortcuts**
2. Select **Services** in the left sidebar
3. Find "Share to Media Manager" under **Files and Folders**
4. Click on it and press your desired shortcut (e.g., ⌘⇧U)

---

# For Deployed Servers

If using a deployed server, update `API_URL` in both scripts:

```bash
API_URL="https://your-media-manager.example.com"
```
