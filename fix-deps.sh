#!/bin/bash

# Simple bash script to fix workspace dependencies for Azure
# This script removes the workspace:* dependency and copies the realtime-client source

echo "Fixing workspace dependencies for Azure deployment..."

ADMIN_CONSOLE_DIR="apps/admin-console"
REALTIME_CLIENT_DIR="packages/realtime-client"

# Update package.json dependencies
if [ -f "$ADMIN_CONSOLE_DIR/package.json" ]; then
  # Use sed to remove the line with @grota/realtime-client
  sed -i '/"@grota\/realtime-client": "workspace:\*"/d' "$ADMIN_CONSOLE_DIR/package.json"
  echo "Removed @grota/realtime-client from package.json"
else
  echo "Error: $ADMIN_CONSOLE_DIR/package.json not found"
  exit 1
fi

# Copy realtime-client source
TARGET_DIR="$ADMIN_CONSOLE_DIR/src/lib/realtime-client"
mkdir -p "$TARGET_DIR"

# Copy source files
if [ -d "$REALTIME_CLIENT_DIR/src" ]; then
  cp -r "$REALTIME_CLIENT_DIR/src/"* "$TARGET_DIR/"
  echo "Copied realtime-client source files"
fi

# Create a fixed index.js file with correct import paths
cat > "$TARGET_DIR/index.js" << 'EOF'
"use client";

export { useRealtimeChannel as default, useRealtimeChannel } from "./use-realtime-channel.js";
export { NotificationProvider, useNotificationBus } from "./notification-bus.js";
export { REALTIME_CHANNELS, REALTIME_EVENT_TYPES } from "./constants.js";
export {
  parseBridgeEvent,
  dispatchBridgeEvent,
  createProposalDraftSnapshot,
  buildNotificationPayload,
} from "./utils.js";
EOF

# Copy index.d.ts if it exists
if [ -f "$REALTIME_CLIENT_DIR/index.d.ts" ]; then
  cp "$REALTIME_CLIENT_DIR/index.d.ts" "$TARGET_DIR/"
fi

echo "Created fixed index.js with correct import paths"

# Create .npmrc file to handle peer dependency issues
cat > "$ADMIN_CONSOLE_DIR/.npmrc" << 'EOF'
# Use legacy peer deps to handle React 19 compatibility
legacy-peer-deps=true

# Skip optional dependencies to speed up install
optional=false

# Set registry if needed
# registry=https://registry.npmjs.org/
EOF

echo "Created .npmrc file to handle peer dependencies"

# Update imports in key files (simplified - just a few files)
update_imports() {
  local file="$1"
  if [ -f "$file" ]; then
    sed -i 's|from "@grota/realtime-client"|from "@/lib/realtime-client"|g' "$file"
    echo "Updated imports in $file"
  fi
}

# Update imports in known files
update_imports "$ADMIN_CONSOLE_DIR/src/presentation/features/painel-geral/components/RealtimeBridgePanel.tsx"
update_imports "$ADMIN_CONSOLE_DIR/src/presentation/features/esteira-propostas/index.tsx"
update_imports "$ADMIN_CONSOLE_DIR/src/presentation/features/painel-geral/components/RecentActivity.tsx"
update_imports "$ADMIN_CONSOLE_DIR/src/presentation/features/esteira-propostas/components/ProposalTimelineSheet.tsx"
update_imports "$ADMIN_CONSOLE_DIR/app/(admin)/gestao-documentos/page.tsx"

echo "Dependencies fixed successfully!"
echo "Azure should now be able to build the admin-console app."