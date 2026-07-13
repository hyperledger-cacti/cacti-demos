#!/bin/sh
set -e
if [ "${SKIP_CONFIGURE:-0}" = "1" ]; then
	echo "  SKIPPED (SKIP_CONFIGURE=1)"
	exit 0
fi
yarn configure
