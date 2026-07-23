#!/bin/sh
set -e

if [ "${SKIP_BUILD_AND_LINT:-0}" = "1" ]; then
	echo "  SKIPPED (SKIP_BUILD_AND_LINT=1)"
	exit 0
fi

echo "Running CI build and lint steps..."
yarn build:dev:backend
yarn build:evm
yarn lint
flake8 .
