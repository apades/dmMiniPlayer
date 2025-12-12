#!/usr/bin/env bash

# Detect and switch Node.js version according to .nvmrc in PWD

nvm_auto_use() {
  local nvmrc_path node_version nvmrc_version nvmrc_major current_major current_minor current_patch
  nvmrc_path="$(pwd)/.nvmrc"

  if [[ -f "$nvmrc_path" && -r "$nvmrc_path" ]]; then
    nvmrc_version="$(command cat "$nvmrc_path" | tr -d '[:space:]')"
    # Ignore empty .nvmrc
    if [[ -z "$nvmrc_version" ]]; then
      return
    fi

    # Try to resolve nvmrc_version to installed node version (if exists)
    node_version="$(node -v 2>/dev/null)"
    if [[ "$node_version" == "none" ]]; then
      node_version=""
    fi

    # Get version details (strip possible "v")
    nvmrc_major="$(echo "$nvmrc_version" | sed -E 's/^v?([0-9]+).*/\1/')"
    current_major=""
    current_minor=""
    current_patch=""

    # Parse current node version, fallback to raw version string if not installed
    if [[ -n "$node_version" ]]; then
      # Remove "v" prefix if any, and parse major.minor.patch
      node_version="${node_version#v}"
      current_major="$(echo "$node_version" | cut -d. -f1)"
      current_minor="$(echo "$node_version" | cut -d. -f2)"
      current_patch="$(echo "$node_version" | cut -d. -f3-)"
    fi

    # Function to check if two versions match according to nvm rules
    is_version_compatible() {
      local base target
      base="$1"
      target="$2"
      # exact match
      [[ "$base" == "$target" ]] && return 0
      # allow .nvmrc '24' to match '24.x.x', and '24.1' to match '24.1.x'
      [[ "$target" == "$base"* ]] && return 0
      return 1
    }

    if [[ -z "$node_version" ]] || ! is_version_compatible "$nvmrc_version" "$node_version"; then
      # Check if nvm command exists
      if ! command -v nvm >/dev/null 2>&1; then
        echo -e "\033[31m[nvm-auto-use] Error: nvm命令不存在。当前版本$node_version，不符合.nvmrc中的版本$nvmrc_version\033[0m"
        return 1
      fi
      previous_version="${node_version:-none}"
      nvm use "$nvmrc_version" >/dev/null 2>&1
      new_version="$(nvm current 2>/dev/null)"
      echo "[nvm-auto-use] node版本切换: v$previous_version → $new_version "
    fi
  fi
}


nvm_auto_use
