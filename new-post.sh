#!/bin/bash
set -e

# Usage: ./new-post.sh "Post Title" "optional-slug"
# Example: ./new-post.sh "How to Build a Shitty Robot" shitty-robot

title="$1"
slug="$2"

if [ -z "$title" ]; then
    echo "Usage: ./new-post.sh \"Post Title\" [slug]"
    exit 1
fi

# Generate slug from title if not provided
if [ -z "$slug" ]; then
    slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')
fi

date=$(date +%Y-%m-%d)
dir="src/posts/${date}-${slug}"

if [ -d "$dir" ]; then
    echo "Error: $dir already exists"
    exit 1
fi

mkdir -p "$dir/media"

cp src/posts/_post-template/meta.json "$dir/meta.json"
cp src/posts/_post-template/index.md "$dir/index.md"

echo ""
echo "Post scaffolded at $dir"
echo ""
echo "Next steps:"
echo "  1. Add header image to $dir/media/"
echo "  2. Edit $dir/index.md"
echo "  3. When ready, set \"published\": true in $dir/meta.json"
echo "  4. Start dev server: npm run dev"
