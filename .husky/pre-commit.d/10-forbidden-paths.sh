#!/bin/sh
set -e
if [ "${SKIP_FORBIDDEN_PATHS:-0}" = "1" ]; then
	echo "  SKIPPED (SKIP_FORBIDDEN_PATHS=1)"
	exit 0
fi
FORBIDDEN=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '(^|/)(dist|generated|node_modules)/' || true)
if [ -n "$FORBIDDEN" ]; then
	echo "  ERROR: staged files inside forbidden build/output dirs:" >&2
	printf '    %s\n' $FORBIDDEN >&2
	exit 1
fi
