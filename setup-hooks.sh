#!/bin/bash

# Setup script - Install git hooks
# Run once: bash setup-hooks.sh

echo "📦 Setting up Git hooks..."

# Make pre-push hook executable
chmod +x .git/hooks/pre-push

echo "✅ Pre-push hook installed"
echo "🔍 Runs security check before every push"
echo ""
echo "Next push will automatically check for:"
echo "   - .env files with secrets"
echo "   - Hardcoded credentials"  
echo "   - Binary database files"
echo "   - node_modules"
echo "   - Large files (>10MB)"
echo ""
echo "Done! Try: git push"
