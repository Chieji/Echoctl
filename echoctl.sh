#!/bin/bash
# echoctl - CLI Agent for ECHOMEN
# Run this script to use echoctl without installation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

python3 -m echoctl.cmd.main "$@"
