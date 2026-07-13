#!/bin/sh
set -e
if [ "${SKIP_LINT_STAGED:-0}" = "1" ]; then
	echo "  SKIPPED (SKIP_LINT_STAGED=1)"
	exit 0
fi
yarn lint-staged
