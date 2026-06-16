#!/bin/bash

# Apply patches
echo "🔧 Applying patches..."

comment_line() {
    local file="$1"
    local line_num="$2"
    
    if [[ -f "$file" ]]; then
        sed -i.bak "${line_num}s|^|// |" "$file"
        echo "✅ Commented line $line_num in $file"
    else
        echo "⚠️  Warning: File $file not found"
    fi
}

replace_complex_content() {
    local file="$1"
    local old_content="$2"
    local new_content="$3"
    
    if [[ -f "$file" ]]; then
        cp "$file" "$file.bak"
        
        local temp_old=$(mktemp)
        local temp_new=$(mktemp)
        printf '%s' "$old_content" > "$temp_old"
        printf '%s' "$new_content" > "$temp_new"
        
        python3 -c "
import sys
with open('$file', 'r') as f:
    content = f.read()
with open('$temp_old', 'r') as f:
    old = f.read()
with open('$temp_new', 'r') as f:
    new = f.read()
content = content.replace(old, new)
with open('$file', 'w') as f:
    f.write(content)
"
        
        rm "$temp_old" "$temp_new"
        echo "✅ Replaced complex content in $file"
    else
        echo "⚠️  Warning: File $file not found"
    fi
}

shopt -s nullglob

echo "Applying common Hardhat patches for versions 3.0.0-3.0.9..."

for dir in ./node_modules/hardhat@3.[0-1]*.[0-9]*/ ./node_modules/.bun/hardhat@3.[0-1]*.[0-9]*/ ; do
    file_to_patch="${dir}node_modules/hardhat/dist/src/internal/builtin-plugins/solidity/build-system/compiler/compiler.js"
    if [[ ! -f "$file_to_patch" ]]; then
        file_to_patch="${dir}dist/src/internal/builtin-plugins/solidity/build-system/compiler/compiler.js"
    fi
    echo "Commenting out await stdoutFileHandle.close() in ${file_to_patch}..."
    comment_line "$file_to_patch" 48
done

for dir in ./node_modules/@nomicfoundation/hardhat-utils@3.[0-1]*.[0-9]*/ ./node_modules/.bun/@nomicfoundation+hardhat-utils@3.[0-1]*.[0-9]*/ ; do
    file_to_patch="${dir}node_modules/@nomicfoundation/hardhat-utils/dist/src/fs.js"
    if [[ ! -f "$file_to_patch" ]]; then
        file_to_patch="${dir}dist/src/fs.js"
    fi
    echo "Commenting out first await fileHandle?.close() in ${file_to_patch}..."
    comment_line "$file_to_patch" 209
    echo "Commenting out second await fileHandle?.close() in ${file_to_patch}..."
    comment_line "$file_to_patch" 275
done

shopt -u nullglob

echo "Disabling ANSI colors in orchestrator log files..."
for file in ./node_modules/.bun/@effectstream+orchestrator@*/node_modules/@effectstream/orchestrator/src/process-manager.ts; do
    if [[ -f "$file" ]] && grep -q 'FORCE_COLOR: "true",' "$file" && ! grep -q 'NO_COLOR: "1"' "$file"; then
        perl -i -pe 's/        FORCE_COLOR: "true",/        ...(logFile ? { NO_COLOR: "1", FORCE_COLOR: "0" } : { FORCE_COLOR: "true" }),/' "$file"
        echo "✅ Patched orchestrator log colors in $file"
    fi
done

FETCH_BLOB="./node_modules/fetch-blob/streams.cjs"
if [[ ! -f "$FETCH_BLOB" ]]; then
    FETCH_BLOB=$(find ./node_modules/.bun -path '*/fetch-blob@*/node_modules/fetch-blob/streams.cjs' 2>/dev/null | head -1)
fi

if [[ -f "$FETCH_BLOB" ]]; then
    echo "Replacing fetch-blob streams.cjs content..."
    replace_complex_content "$FETCH_BLOB" "  // \`node:stream/web\` got introduced in v16.5.0 as experimental
  // and it's preferred over the polyfilled version. So we also
  // suppress the warning that gets emitted by NodeJS for using it.
  try {
    const process = require('node:process')
    const { emitWarning } = process
    try {
      process.emitWarning = () => {}
      Object.assign(globalThis, require('node:stream/web'))
      process.emitWarning = emitWarning
    } catch (error) {
      process.emitWarning = emitWarning
      throw error
    }
  } catch (error) {
    // fallback to polyfill implementation
    Object.assign(globalThis, require('web-streams-polyfill/dist/ponyfill.es2018.js'))
  }" "  Object.assign(globalThis, require('web-streams-polyfill/dist/ponyfill.es2018.js'))"
fi

FETCH_FROM="${FETCH_BLOB%/streams.cjs}/from.js"
if [[ -f "$FETCH_FROM" ]]; then
    echo "Replacing fetch-blob from.js imports..."
    replace_complex_content "$FETCH_FROM" "import { statSync, createReadStream, promises as fs } from 'node:fs'
import { basename } from 'node:path'
import DOMException from 'node-domexception'

import File from './file.js'
import Blob from './index.js'

const { stat } = fs" "import { statSync, createReadStream } from 'node:fs'
import { basename } from 'node:path'
import DOMException from 'node-domexception'

import File from './file.js'
import Blob from './index.js'

import { promises as stat } from 'node:fs'
"
fi

echo "Patching @seriousme/opifex socket.js async close/write rejections (Bun turns the unhandled rejection into process.exit(1))..."
for file in ./node_modules/@seriousme/opifex/dist/socket/socket.js ./node_modules/.bun/@seriousme+opifex@*/node_modules/@seriousme/opifex/dist/socket/socket.js; do
    if [[ -f "$file" ]]; then
        if grep -q 'this.writer.close();' "$file"; then
            perl -i -pe 's/this\.writer\.close\(\);/this.writer.close().catch(() => {});/' "$file"
            perl -i -pe 's/this\.writer\.write\(data\);/this.writer.write(data).catch(() => {});/' "$file"
            echo "✅ Patched opifex socket.js in $file"
        else
            echo "ℹ️  opifex socket.js already patched (or shape changed): $file"
        fi
    fi
done

echo "✅ All patches applied successfully"
