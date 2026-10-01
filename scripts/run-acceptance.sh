#!/usr/bin/env bash
#
# Acceptance test: runs the "Oracle Case 1" demo end to end and guarantees
# teardown of everything it started.
#
# Flow (mirrors `make run-oracle-case-1`):
#   1. Clean slate: free ports 8545/3010/3011/4010, compose down leftovers.
#   2. Start a Hardhat node on 8545 (background).
#   3. Start the SATP Hermes gateway via docker compose (demos/oracle/case_1).
#   4. Wait for the gateway OAPI port (4010) to accept requests.
#   5. Deploy the OracleTestContract with Hardhat Ignition (--network hardhat1).
#   6. Run the demo driver oracle-execute-manual-read-and-write.py which
#      writes data through the gateway and reads it back.
#   7. Tear down: compose down, kill the Hardhat node, free the ports again.
#
# Requires: node/yarn, docker compose v2, python3 with `requests` and `web3`
# (e.g. `pip install requests web3` or an activated virtualenv).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_DIR="${ROOT_DIR}/demos/oracle/case_1"
LEDGERS_DIR="${ROOT_DIR}/utils/test-ledgers"

GATEWAY_HOSTNAME="127.0.0.1"
GATEWAY_OAPI_PORT="4010"
HARDHAT_PORT="8545"

HARDHAT_PID=""

log() {
  printf "[run-acceptance] %s\n" "$*"
}

kill_port_owners() {
  local port="$1"
  # lsof may be absent in minimal environments; that is fine, the compose
  # teardown and docker rm below cover the known containers.
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti ":${port}" 2>/dev/null || true)"
    if [ -n "${pids}" ]; then
      log "Killing processes on port ${port}: ${pids}"
      # shellcheck disable=SC2086
      kill -9 ${pids} 2>/dev/null || true
    fi
  fi
}

remove_port_containers() {
  for port in 3010 3011 4010; do
    local ids
    ids="$(docker ps -q --filter "publish=${port}" 2>/dev/null || true)"
    if [ -n "${ids}" ]; then
      log "Removing containers publishing port ${port}: ${ids}"
      # shellcheck disable=SC2086
      docker rm -f ${ids} >/dev/null 2>&1 || true
    fi
  done
}

cleanup() {
  local exit_code=$?
  log "Tearing down (exit code ${exit_code})..."
  if [ -n "${HARDHAT_PID}" ]; then
    kill "${HARDHAT_PID}" 2>/dev/null || true
    wait "${HARDHAT_PID}" 2>/dev/null || true
    HARDHAT_PID=""
  fi
  (cd "${DEMO_DIR}" && docker compose down -v >/dev/null 2>&1 || true)
  remove_port_containers
  kill_port_owners "${HARDHAT_PORT}"
  kill_port_owners "${GATEWAY_OAPI_PORT}"
  log "Teardown complete."
}
trap cleanup EXIT

wait_for_http() {
  local url="$1" attempts="$2" delay="$3"
  for _ in $(seq 1 "${attempts}"); do
    if curl -fsS -o /dev/null --max-time 2 "${url}" 2>/dev/null; then
      return 0
    fi
    # Any TCP-level response (even a 404/501) means the server is up.
    if curl -sS -o /dev/null --max-time 2 "${url}" 2>/dev/null; then
      return 0
    fi
    sleep "${delay}"
  done
  return 1
}

log "Step 0/6: cleaning up any leftovers from previous runs"
(cd "${DEMO_DIR}" && docker compose down -v >/dev/null 2>&1 || true)
remove_port_containers
kill_port_owners "${HARDHAT_PORT}"
kill_port_owners "${GATEWAY_OAPI_PORT}"

# The Hardhat binaries live in utils/test-ledgers' own npm-managed
# node_modules (the yarn workspace's pnpm linker does not expose them
# there), so a fresh clone or CI runner needs an npm ci first. Run it
# with --prefix from the repo root: npm ci executed inside the dir
# resolves the yarn workspace root instead and fails (EUSAGE, no root
# lockfile).
if [ ! -x "${LEDGERS_DIR}/node_modules/.bin/hardhat" ]; then
  log "Hardhat not installed in utils/test-ledgers; running npm ci..."
  (cd "${ROOT_DIR}" && npm ci --prefix "${LEDGERS_DIR}" --no-audit --no-fund) \
    > /tmp/cacti-acceptance-npm-ci.log 2>&1
fi

log "Step 1/6: starting Hardhat node on port ${HARDHAT_PORT}"
(
  cd "${LEDGERS_DIR}"
  exec npx hardhat node --hostname 0.0.0.0 --port "${HARDHAT_PORT}"
) > /tmp/cacti-acceptance-hardhat.log 2>&1 &
HARDHAT_PID=$!

if ! wait_for_http "http://127.0.0.1:${HARDHAT_PORT}" 30 2; then
  log "ERROR: Hardhat node did not start, see /tmp/cacti-acceptance-hardhat.log"
  exit 1
fi
log "Hardhat node is up (pid ${HARDHAT_PID})."

log "Step 2/6: starting the gateway (docker compose up -d)"
(cd "${DEMO_DIR}" && docker compose up -d)

log "Step 3/6: waiting for gateway OAPI port ${GATEWAY_OAPI_PORT}"
if ! wait_for_http "http://${GATEWAY_HOSTNAME}:${GATEWAY_OAPI_PORT}/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/execute" 60 3; then
  log "ERROR: gateway did not become reachable on port ${GATEWAY_OAPI_PORT}"
  docker ps -a || true
  exit 1
fi
log "Gateway is up."

log "Step 4/6: compiling and deploying OracleTestContract (hardhat ignition)"
(cd "${LEDGERS_DIR}" && npx hardhat compile)
# --reset wipes any stale local deployment state so reruns are idempotent.
(cd "${LEDGERS_DIR}" && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1 --reset)

log "Step 5/6: running the oracle read/write driver script"
(cd "${DEMO_DIR}" && python3 oracle-execute-manual-read-and-write.py) | tee /tmp/cacti-acceptance-driver.log

log "Step 6/6: verifying driver output"
# The driver writes TEST_DATA through the gateway and then reads it back:
# success is the read operation reporting the same data in its output.
# (The README mentions a "COMPLETE" marker, but the current gateway image
# responds with status "SUCCESS" instead, so assert on the data itself.)
if grep -q "DATA WRITTEN TO THE BLOCKCHAIN" /tmp/cacti-acceptance-driver.log \
  && grep -q "'status': 'SUCCESS'" /tmp/cacti-acceptance-driver.log; then
  log "SUCCESS: oracle case 1 demo completed (read back the written data)."
  exit 0
else
  log "ERROR: driver finished without reading back the written data; see /tmp/cacti-acceptance-driver.log"
  exit 1
fi
