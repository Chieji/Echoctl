#!/bin/bash
# Build script that adds .js extensions to compiled files

# Compile TypeScript
npx tsc

# Add .js extensions to all imports in dist folder (only if not already present)
find dist -name "*.js" -type f -exec sed -i "s/from '\.\.\/\([^.]*\)'/from '..\/\1.js'/g" {} \;
find dist -name "*.js" -type f -exec sed -i "s/from '\.\/\([^.]*\)'/from '.\/\1.js'/g" {} \;

echo "Build complete with .js extensions added"
