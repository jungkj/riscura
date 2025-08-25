#!/bin/bash
# Restore script for API cleanup
echo "Restoring API files from backup..."
cp -r * ../../src/app/api/
echo "Restore complete!"
