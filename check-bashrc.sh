#!/bin/bash

echo "=== Current ~/.bashrc contents ==="
cat ~/.bashrc
echo ""
echo "=== End of ~/.bashrc ==="
echo ""

# Test if the direct claude path works
echo "Testing direct claude path..."
CLAUDE_PATH="/c/Users/andy.jung/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.4.1-win-x64/claude"

if [ -f "$CLAUDE_PATH" ]; then
    echo "✅ Claude file exists at: $CLAUDE_PATH"
    echo "Testing direct execution..."
    "$CLAUDE_PATH" --version
else
    echo "❌ Claude file not found at: $CLAUDE_PATH"
fi 