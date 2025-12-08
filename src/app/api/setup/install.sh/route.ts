import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://media.hieunguyen.dev";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Error: No token provided", { status: 400 });
  }

  // Validate the token
  const payload = verifyToken(token);
  if (!payload) {
    return new NextResponse("Error: Invalid or expired token", { status: 401 });
  }

  const script = generateInstallScript(API_URL, token);

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function generateInstallScript(apiUrl: string, authToken: string): string {
  return `#!/bin/bash

# ============================================
# Media Manager - macOS Quick Share Installer
# ============================================
# This script sets up:
# 1. Quick Share Action (right-click to upload)
# 2. Menu Bar App (view recent uploads)
# ============================================

set -e

API_URL="${apiUrl}"
AUTH_TOKEN="${authToken}"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

echo ""
echo "=========================================="
echo "  Media Manager - macOS Quick Share Setup"
echo "=========================================="
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "\${RED}Error: This script only works on macOS\${NC}"
    exit 1
fi

echo -e "\${GREEN}[1/6]\${NC} Checking for Homebrew..."

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo -e "\${YELLOW}Homebrew not found. Installing...\${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
fi

echo -e "\${GREEN}[2/6]\${NC} Installing dependencies (jq, SwiftBar)..."

# Install jq if not present
if ! command -v jq &> /dev/null; then
    brew install jq
fi

# Install SwiftBar if not present
if [[ ! -d "/Applications/SwiftBar.app" ]]; then
    brew install --cask swiftbar
fi

echo -e "\${GREEN}[3/6]\${NC} Creating upload script..."

# Create ~/bin directory
mkdir -p ~/bin

# Create upload script
cat > ~/bin/upload-to-media-manager.sh << 'UPLOAD_SCRIPT'
#!/bin/bash

# Simple Media Manager - File Upload Script
API_URL="__API_URL__"
AUTH_TOKEN="__AUTH_TOKEN__"

if [ -z "$1" ]; then
    osascript -e 'display notification "No file provided" with title "Media Manager" subtitle "Error"'
    exit 1
fi

FILE_PATH="$1"

if [ ! -f "$FILE_PATH" ]; then
    osascript -e 'display notification "File not found" with title "Media Manager" subtitle "Error"'
    exit 1
fi

FILENAME=$(basename "$FILE_PATH")
EXTENSION="\${FILENAME##*.}"
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

osascript -e 'display notification "Uploading '"$FILENAME"'..." with title "Media Manager"'

RESPONSE=$(curl -s -X POST "\${API_URL}/api/media" \\
    -H "Authorization: Bearer \${AUTH_TOKEN}" \\
    -F "file=@\${FILE_PATH};type=\${MIME_TYPE}")

if echo "$RESPONSE" | grep -q '"shareLink"'; then
    SHARE_LINK=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['shareLink'])" 2>/dev/null)
    if [ -n "$SHARE_LINK" ]; then
        echo -n "$SHARE_LINK" | pbcopy
        osascript -e 'display notification "Link copied to clipboard!" with title "Media Manager" subtitle "Upload successful"'
        exit 0
    fi
fi

ERROR_MSG=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', 'Unknown error'))" 2>/dev/null || echo "Upload failed")
osascript -e 'display notification "'"$ERROR_MSG"'" with title "Media Manager" subtitle "Error"'
exit 1
UPLOAD_SCRIPT

# Replace placeholders with actual values
sed -i '' "s|__API_URL__|$API_URL|g" ~/bin/upload-to-media-manager.sh
sed -i '' "s|__AUTH_TOKEN__|$AUTH_TOKEN|g" ~/bin/upload-to-media-manager.sh
chmod +x ~/bin/upload-to-media-manager.sh

echo -e "\${GREEN}[4/6]\${NC} Creating SwiftBar menu bar plugin..."

# Create SwiftBar plugins directory
mkdir -p ~/Library/Application\\ Support/SwiftBar/Plugins

# Create SwiftBar plugin
cat > ~/Library/Application\\ Support/SwiftBar/Plugins/media-manager-recents.1m.sh << 'SWIFTBAR_SCRIPT'
#!/bin/bash

API_URL="__API_URL__"
AUTH_TOKEN="__AUTH_TOKEN__"

echo "📷"
echo "---"

RESPONSE=$(curl -s -X GET "\${API_URL}/api/media?limit=20" \\
    -H "Authorization: Bearer \${AUTH_TOKEN}" \\
    -H "Content-Type: application/json" 2>/dev/null)

if [ -z "$RESPONSE" ]; then
    echo "Error: Could not connect | color=red"
    exit 0
fi

if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    ERROR=$(echo "$RESPONSE" | jq -r '.error')
    echo "Error: $ERROR | color=red"
    exit 0
fi

MEDIA_COUNT=$(echo "$RESPONSE" | jq -r '.media | length' 2>/dev/null)

if [ "$MEDIA_COUNT" = "0" ] || [ -z "$MEDIA_COUNT" ]; then
    echo "No uploads yet"
    exit 0
fi

echo "Recent Uploads ($MEDIA_COUNT) | size=12"
echo "---"

echo "$RESPONSE" | jq -r '.media[] | "\\(.originalName)|\\(.id)|\\(.type)|\\(.createdAt)"' 2>/dev/null | while IFS='|' read -r name id type created; do
    if [ \${#name} -gt 40 ]; then
        display_name="\${name:0:37}..."
    else
        display_name="$name"
    fi

    if [ "$type" = "IMAGE" ]; then
        icon="🖼"
    else
        icon="🎬"
    fi

    date_part=$(echo "$created" | cut -d'T' -f1)
    share_link="\${API_URL}/v/\${id}"

    echo "$icon $display_name | bash='echo -n \\"$share_link\\" | pbcopy' terminal=false refresh=false"
    echo "-- 📋 Copy link | bash='echo -n \\"$share_link\\" | pbcopy' terminal=false"
    echo "-- 🌐 Open in browser | href=$share_link"
    echo "-- 📅 $date_part | disabled=true"
done

echo "---"
echo "🔄 Refresh | refresh=true"
echo "⚙️ Open Media Manager | href=\${API_URL}"
SWIFTBAR_SCRIPT

# Replace placeholders with actual values
sed -i '' "s|__API_URL__|$API_URL|g" ~/Library/Application\\ Support/SwiftBar/Plugins/media-manager-recents.1m.sh
sed -i '' "s|__AUTH_TOKEN__|$AUTH_TOKEN|g" ~/Library/Application\\ Support/SwiftBar/Plugins/media-manager-recents.1m.sh
chmod +x ~/Library/Application\\ Support/SwiftBar/Plugins/media-manager-recents.1m.sh

echo -e "\${GREEN}[5/6]\${NC} Creating Automator Quick Action..."

# Create Quick Action workflow
WORKFLOW_DIR=~/Library/Services/"Share to Media Manager.workflow"/Contents
mkdir -p "$WORKFLOW_DIR"

# Create Info.plist
cat > "$WORKFLOW_DIR/Info.plist" << 'INFO_PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSServices</key>
    <array>
        <dict>
            <key>NSMenuItem</key>
            <dict>
                <key>default</key>
                <string>Share to Media Manager</string>
            </dict>
            <key>NSMessage</key>
            <string>runWorkflowAsService</string>
            <key>NSSendFileTypes</key>
            <array>
                <string>public.item</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
INFO_PLIST

# Create document.wflow
cat > "$WORKFLOW_DIR/document.wflow" << 'DOCUMENT_WFLOW'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>AMApplicationBuild</key>
    <string>523</string>
    <key>AMApplicationVersion</key>
    <string>2.10</string>
    <key>AMDocumentVersion</key>
    <string>2</string>
    <key>actions</key>
    <array>
        <dict>
            <key>action</key>
            <dict>
                <key>AMAccepts</key>
                <dict>
                    <key>Container</key>
                    <string>List</string>
                    <key>Optional</key>
                    <true/>
                    <key>Types</key>
                    <array>
                        <string>com.apple.cocoa.path</string>
                    </array>
                </dict>
                <key>AMActionVersion</key>
                <string>2.0.3</string>
                <key>AMApplication</key>
                <array>
                    <string>Automator</string>
                </array>
                <key>AMCategory</key>
                <string>AMCategoryUtilities</string>
                <key>AMIconName</key>
                <string>Run Shell Script</string>
                <key>AMName</key>
                <string>Run Shell Script</string>
                <key>AMParameterProperties</key>
                <dict>
                    <key>COMMAND_STRING</key>
                    <dict/>
                    <key>CheckedForUserDefaultShell</key>
                    <dict/>
                    <key>inputMethod</key>
                    <dict/>
                    <key>shell</key>
                    <dict/>
                    <key>source</key>
                    <dict/>
                </dict>
                <key>AMProvides</key>
                <dict>
                    <key>Container</key>
                    <string>List</string>
                    <key>Types</key>
                    <array>
                        <string>com.apple.cocoa.path</string>
                    </array>
                </dict>
                <key>ActionBundlePath</key>
                <string>/System/Library/Automator/Run Shell Script.action</string>
                <key>ActionName</key>
                <string>Run Shell Script</string>
                <key>ActionParameters</key>
                <dict>
                    <key>COMMAND_STRING</key>
                    <string>for f in "$@"
do
    "$HOME/bin/upload-to-media-manager.sh" "$f"
done</string>
                    <key>CheckedForUserDefaultShell</key>
                    <true/>
                    <key>inputMethod</key>
                    <integer>1</integer>
                    <key>shell</key>
                    <string>/bin/bash</string>
                    <key>source</key>
                    <string></string>
                </dict>
                <key>BundleIdentifier</key>
                <string>com.apple.RunShellScript</string>
                <key>CFBundleVersion</key>
                <string>2.0.3</string>
                <key>CanShowSelectedItemsWhenRun</key>
                <false/>
                <key>CanShowWhenRun</key>
                <true/>
                <key>Category</key>
                <array>
                    <string>AMCategoryUtilities</string>
                </array>
                <key>Class Name</key>
                <string>RunShellScriptAction</string>
                <key>InputUUID</key>
                <string>2E5E9D9C-7A3D-4B5E-8C1F-9D2A3B4C5E6F</string>
                <key>Keywords</key>
                <array>
                    <string>Shell</string>
                    <string>Script</string>
                    <string>Command</string>
                    <string>Run</string>
                    <string>Unix</string>
                </array>
                <key>OutputUUID</key>
                <string>3F6F0E0D-8B4E-5C6F-9D2G-0E3B4C5D6F7G</string>
                <key>UUID</key>
                <string>1D4D8C8B-6A2C-3A4D-7B0E-8C1D2A3B4C5D</string>
                <key>UnlocalizedApplications</key>
                <array>
                    <string>Automator</string>
                </array>
                <key>arguments</key>
                <dict>
                    <key>0</key>
                    <dict>
                        <key>default value</key>
                        <integer>1</integer>
                        <key>name</key>
                        <string>inputMethod</string>
                        <key>required</key>
                        <string>0</string>
                        <key>type</key>
                        <string>0</string>
                        <key>uuid</key>
                        <string>0</string>
                    </dict>
                    <key>1</key>
                    <dict>
                        <key>default value</key>
                        <string></string>
                        <key>name</key>
                        <string>source</string>
                        <key>required</key>
                        <string>0</string>
                        <key>type</key>
                        <string>0</string>
                        <key>uuid</key>
                        <string>1</string>
                    </dict>
                    <key>2</key>
                    <dict>
                        <key>default value</key>
                        <true/>
                        <key>name</key>
                        <string>CheckedForUserDefaultShell</string>
                        <key>required</key>
                        <string>0</string>
                        <key>type</key>
                        <string>0</string>
                        <key>uuid</key>
                        <string>2</string>
                    </dict>
                    <key>3</key>
                    <dict>
                        <key>default value</key>
                        <string>for f in "$@"
do
    "$HOME/bin/upload-to-media-manager.sh" "$f"
done</string>
                        <key>name</key>
                        <string>COMMAND_STRING</string>
                        <key>required</key>
                        <string>0</string>
                        <key>type</key>
                        <string>0</string>
                        <key>uuid</key>
                        <string>3</string>
                    </dict>
                    <key>4</key>
                    <dict>
                        <key>default value</key>
                        <string>/bin/bash</string>
                        <key>name</key>
                        <string>shell</string>
                        <key>required</key>
                        <string>0</string>
                        <key>type</key>
                        <string>0</string>
                        <key>uuid</key>
                        <string>4</string>
                    </dict>
                </dict>
                <key>conversionLabel</key>
                <integer>0</integer>
                <key>isViewVisible</key>
                <integer>1</integer>
                <key>location</key>
                <string>309.000000:253.000000</string>
                <key>nibPath</key>
                <string>/System/Library/Automator/Run Shell Script.action/Contents/Resources/Base.lproj/main.nib</string>
            </dict>
            <key>isViewVisible</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>connectors</key>
    <dict/>
    <key>workflowMetaData</key>
    <dict>
        <key>serviceInputTypeIdentifier</key>
        <string>com.apple.Automator.fileSystemObject</string>
        <key>serviceOutputTypeIdentifier</key>
        <string>com.apple.Automator.nothing</string>
        <key>serviceProcessesInput</key>
        <integer>0</integer>
        <key>workflowTypeIdentifier</key>
        <string>com.apple.Automator.servicesMenu</string>
    </dict>
</dict>
</plist>
DOCUMENT_WFLOW

echo -e "\${GREEN}[6/6]\${NC} Launching SwiftBar..."

# Refresh services and launch SwiftBar
/System/Library/CoreServices/pbs -update 2>/dev/null || true
open -a SwiftBar 2>/dev/null || true

echo ""
echo -e "\${GREEN}=========================================="
echo "  Setup Complete!"
echo "==========================================\${NC}"
echo ""
echo "You can now:"
echo "  1. Right-click any image/video → Quick Actions → Share to Media Manager"
echo "  2. Click the 📷 icon in your menu bar to see recent uploads"
echo ""
echo "If the Quick Action doesn't appear, you may need to:"
echo "  - Log out and back in, OR"
echo "  - Go to System Settings → Privacy & Security → Extensions → Finder"
echo ""

# Show success notification
osascript -e 'display notification "Quick Share and Menu Bar app installed!" with title "Media Manager" subtitle "Setup Complete"'
`;
}
