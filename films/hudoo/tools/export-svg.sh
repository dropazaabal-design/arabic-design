#!/bin/sh
# Bundle the exporter (TSX) with esbuild and run it with node.
set -e
cd "$(dirname "$0")/.."
npx esbuild tools/export-svg.tsx --bundle --platform=node --format=cjs --jsx=automatic --loader:.json=json --outfile=tools/.export-svg.cjs --log-level=warning \
  --alias:react=./node_modules/react --alias:react-dom=./node_modules/react-dom --external:remotion
node tools/.export-svg.cjs
