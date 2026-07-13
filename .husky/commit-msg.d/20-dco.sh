#!/bin/sh
set -e
if [ "${SKIP_DCO:-0}" = "1" ]; then
	echo "  SKIPPED (SKIP_DCO=1)"
	exit 0
fi
if ! grep -qE '^Signed-off-by: .+ <.+@.+\..+>' "$1"; then
	echo "  ERROR: Missing 'Signed-off-by' trailer (DCO)." >&2
	echo "  Amend with:  git commit --amend --signoff --no-edit" >&2
	exit 1
fi
