#!/bin/sh
set -e
if [ "${SKIP_COMMITLINT:-0}" = "1" ]; then
	echo "  SKIPPED (SKIP_COMMITLINT=1)"
	exit 0
fi
yarn commitlint --edit "$1"
