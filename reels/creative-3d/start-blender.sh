#!/usr/bin/env bash
# creative-3d on a Linux cloud container (fresh each session): Blender 4.5 LTS (checksum-verified) → the official
# mcp-for-blender addon, enabled → the `blender` MCP server registered for Claude Code (telemetry off) → Blender's UI on
# a virtual display, so the addon's server runs (it refuses `blender -b`). Idempotent: each step is skipped when done.
# On your own Windows/macOS/Linux desktop do NOT use this: run `uvx mcp-for-blender setup` and open Blender normally.
# The addon's socket has no auth: it stays on localhost; never publish port 9876 (use an SSH tunnel if you must).
# usage: bash reels/creative-3d/start-blender.sh      → ends with `backend.py check` (exit 0 = ready)
set -euo pipefail
VER=4.5.9
HERE=$(cd "$(dirname "$0")" && pwd)
command -v uvx >/dev/null || { echo "uvx missing: curl -LsSf https://astral.sh/uv/install.sh | sh" >&2; exit 1; }
command -v xvfb-run >/dev/null || { echo "xvfb-run missing: apt-get install -y xvfb" >&2; exit 1; }

if ! command -v blender >/dev/null; then
  tmp=$(mktemp -d)
  base=https://download.blender.org/release/Blender${VER%.*}
  curl -fsSL -o "$tmp/blender.tar.xz" "$base/blender-$VER-linux-x64.tar.xz"
  echo "$(curl -fsSL "$base/blender-$VER.sha256" | awk '/linux-x64/{print $1}')  $tmp/blender.tar.xz" | sha256sum -c --quiet -
  tar -xf "$tmp/blender.tar.xz" -C /opt && rm -rf "$tmp"
  ln -sf "/opt/blender-$VER-linux-x64/blender" /usr/local/bin/blender
fi

uvx mcp-for-blender install-addon >/dev/null
blender -b -noaudio --python-expr "import bpy; bpy.ops.preferences.addon_enable(module='blender_mcp'); bpy.ops.wm.save_userpref()" >/dev/null 2>&1
claude mcp get blender >/dev/null 2>&1 || claude mcp add --scope user blender -e DISABLE_TELEMETRY=true -- "$(command -v uvx)" mcp-for-blender

if ! python3 "$HERE/backend.py" check >/dev/null; then
  nohup xvfb-run -a -s "-screen 0 1920x1080x24" blender -noaudio > /tmp/blender-ui.log 2>&1 &
  for _ in $(seq 90); do python3 "$HERE/backend.py" check >/dev/null && break; sleep 1; done
fi
python3 "$HERE/backend.py" check
