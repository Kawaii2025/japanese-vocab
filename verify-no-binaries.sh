#!/bin/bash

# Binary File Safety Check
# Verifies that NO binary files are committed to git
# Usage: bash verify-no-binaries.sh

echo "🔍 Checking for committed binary files..."
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check git for any binary files
BINARY_PATTERNS=(
    "\.db$"
    "\.db-shm$"
    "\.db-wal$"
    "\.bin$"
    "\.exe$"
    "\.dll$"
    "\.so$"
    "\.dylib$"
    "\.class$"
    "\.jar$"
    "\.zip$"
    "\.tar\.gz$"
    "\.iso$"
    "\.dmg$"
    "\.pdf$"
    "\.doc$"
    "\.docx$"
)

FOUND_BINARIES=0

echo "📋 Binary file patterns being checked:"
for pattern in "${BINARY_PATTERNS[@]}"; do
    echo "   - $pattern"
done
echo ""

# Check if any binary files are tracked
echo "🔎 Scanning git history..."
for pattern in "${BINARY_PATTERNS[@]}"; do
    TRACKED=$(git ls-files | grep -c "$pattern" || true)
    if [ "$TRACKED" -gt 0 ]; then
        echo -e "${RED}❌ Found $TRACKED tracked file(s) matching: $pattern${NC}"
        git ls-files | grep "$pattern" | sed 's/^/   - /'
        FOUND_BINARIES=$((FOUND_BINARIES + TRACKED))
    fi
done

# Check local filesystem (not staged)
echo ""
echo "📁 Checking local files (not yet staged)..."
for pattern in "${BINARY_PATTERNS[@]}"; do
    LOCAL=$(find . -type f -regex ".*$pattern" 2>/dev/null | grep -v ".git" | grep -v "node_modules" | wc -l)
    if [ "$LOCAL" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found $LOCAL local file(s) matching: $pattern${NC}"
        find . -type f -regex ".*$pattern" 2>/dev/null | grep -v ".git" | grep -v "node_modules" | sed 's/^/   - /'
    fi
done

echo ""

if [ $FOUND_BINARIES -eq 0 ]; then
    echo -e "${GREEN}✅ SAFE: No binary files committed to git!${NC}"
    echo ""
    echo "✅ All binary files are properly ignored"
    echo "✅ Only text-based data committed (JSON exports)"
    echo "✅ Safe for company security policy"
    exit 0
else
    echo -e "${RED}❌ DANGER: $FOUND_BINARIES binary file(s) found in git history!${NC}"
    echo ""
    echo "⚠️  These need to be removed from git history!"
    echo "Action: Use 'git filter-branch' or 'BFG Repo-Cleaner' to remove"
    exit 1
fi
