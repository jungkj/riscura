#!/bin/bash

# Setup Node.js and Claude Code for Git Bash
echo "Setting up Node.js and Claude Code for Git Bash..."

# Add Node.js to PATH for this session
NODE_PATH="/c/Users/$(whoami)/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.4.1-win-x64"

if [ -d "$NODE_PATH" ]; then
    export PATH="$NODE_PATH:$PATH"
    echo "✅ Node.js path added to PATH"
    
    # Test Node.js
    echo "Testing Node.js..."
    node --version
    npm --version
    
    # Test Claude Code
    echo "Testing Claude Code..."
    claude --version
    
    echo ""
    echo "🎉 Setup complete! You can now use:"
    echo "  - node --version"
    echo "  - npm --version" 
    echo "  - claude"
    echo ""
    echo "⚠️  Note: This setup is only for the current session."
    echo "   To make it permanent, add the export line to your ~/.bashrc"
else
    echo "❌ Node.js installation not found at expected location"
    echo "Expected: $NODE_PATH"
fi 