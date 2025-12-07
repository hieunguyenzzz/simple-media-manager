# macOS Quick Action Setup

This guide will help you add a "Share to Media Manager" option to your right-click context menu on macOS.

## Prerequisites

1. Your Media Manager server is running (locally or deployed)
2. You have an account and auth token

## Step 1: Get Your Auth Token

First, get your authentication token by logging in:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

Copy the `token` value from the response.

## Step 2: Install the Script

1. Copy the script to a permanent location:

```bash
mkdir -p ~/bin
cp scripts/upload-to-media-manager.sh ~/bin/
chmod +x ~/bin/upload-to-media-manager.sh
```

2. Edit the script and update the configuration:

```bash
nano ~/bin/upload-to-media-manager.sh
```

Update these values at the top of the file:
- `API_URL` - Your media manager URL (e.g., `http://localhost:3000` or your deployed URL)
- `AUTH_TOKEN` - The token you got from Step 1

## Step 3: Create the Quick Action

1. Open **Automator** (search for it in Spotlight)

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
    ~/bin/upload-to-media-manager.sh "$f"
done
```

7. Save the workflow:
   - Press ⌘S
   - Name it: `Share to Media Manager`

## Step 4: Test It

1. Right-click on any image or video file
2. Go to **Quick Actions** → **Share to Media Manager**
3. Wait for the notification
4. The share link is now in your clipboard - paste it anywhere!

## Troubleshooting

### "Error: Not authenticated"
Your auth token may have expired. Get a new one from Step 1.

### "Error: Unsupported file type"
Only these file types are supported:
- Images: JPEG, PNG, GIF, WebP, SVG
- Videos: MP4, WebM, OGG, MOV

### Quick Action not appearing
1. Go to **System Preferences** → **Extensions** → **Finder**
2. Make sure "Share to Media Manager" is checked

### Script permission denied
Run: `chmod +x ~/bin/upload-to-media-manager.sh`

## Alternative: Keyboard Shortcut

You can also assign a keyboard shortcut:

1. Go to **System Preferences** → **Keyboard** → **Shortcuts**
2. Select **Services** in the left sidebar
3. Find "Share to Media Manager" under **Files and Folders**
4. Click on it and press your desired shortcut (e.g., ⌘⇧U)

## For Deployed Servers

If your media manager is deployed (not localhost), update `API_URL` in the script:

```bash
API_URL="https://your-media-manager.example.com"
```

Make sure your server accepts uploads from your network.
