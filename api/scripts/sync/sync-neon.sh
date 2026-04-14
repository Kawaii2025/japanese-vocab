#!/bin/bash

# Sync to Neon wrapper script
# Automatically loads DATABASE_URL from .env.neon and runs sync

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load DATABASE_URL from .env.neon (in parent directory)
if [ ! -f "$SCRIPT_DIR/../../.env.neon" ]; then
  echo "❌ Error: .env.neon file not found at $SCRIPT_DIR/../../.env.neon"
  exit 1
fi

# Export DATABASE_URL from .env.neon
export $(grep DATABASE_URL "$SCRIPT_DIR/../../.env.neon" | xargs)

# Run the sync script
echo "🔄 Starting Neon sync..."
node "$SCRIPT_DIR/sync-to-neon-partial.js"
