SHORTWAIT = 1
MEDIUMWAIT = 3
LONGWAIT = 6

.PHONY: clean
clean:
	# 1. Stop and remove all experiment containers and volumes
	@echo "Stopping and removing all experiment containers and volumes..."
	@docker compose -f gateway/oracle/case_1/docker-compose.yaml down -v || true
	@docker compose -f gateway/oracle/case_2/docker-compose.yaml down -v || true
	@docker compose -f gateway/oracle/case_3/docker-compose.yaml down -v || true
	@docker compose -f gateway/oracle/case_4/docker-compose.yaml down -v || true
	@docker compose -f gateway/satp/case_1/docker-compose.yaml down -v || true
	@docker compose -f gateway/satp/case_2/docker-compose.yaml down -v || true
	@docker compose -f gateway/satp/case_3/docker-compose.yaml down -v || true


	# 2. Remove containers by image name and port
	@docker ps -a --format '{{.ID}} {{.Ports}}' | awk '/3010|3011|4010/ {print $1}' | xargs -r docker rm -f || true
	@docker ps -a --filter ancestor=5c4a6ec3b166 --format '{{.ID}}' | xargs -r docker rm -f || true
	@docker ps -a --filter ancestor=tomassilva2187/satp-gateway:2026-02-02-1458 --format '{{.ID}}' | xargs -r docker rm -f || true
	@docker ps -a --filter name=case_1-satp-hermes-gateway- --format '{{.ID}}' | xargs -r docker rm -f || true
	@docker ps -a --filter name=case_2-satp-hermes-gateway- --format '{{.ID}}' | xargs -r docker rm -f || true
	@docker ps -a --filter name=case_3-satp-hermes-gateway- --format '{{.ID}}' | xargs -r docker rm -f || true

	# 3. Kill any process using ports 8545 or 8546 or 8547 (Hardhat nodes)
	@lsof -ti:8545 | xargs -r kill -9 || true
	@lsof -ti:8546 | xargs -r kill -9 || true
	@lsof -ti:8547 | xargs -r kill -9 || true

	@echo "Clean complete."

.PHONY: run-satp-case-1
run-satp-case-1:
	@echo "Running SATP Case 1: Gateway as Middleware for READ_AND_WRITE in EVM-based blockchains..."
	$(MAKE) clean-port-container PORT=3010
	# Start Hardhat EVM Blockchain 1 (port 8545)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8545 &)
	sleep $(MEDIUMWAIT)
	# Start Hardhat EVM Blockchain 2 (port 8546)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8546 &)
	sleep $(MEDIUMWAIT)
	# Start the Gateway (Docker Compose)
	(cd gateway/satp/case_1 && docker compose up -d)
	sleep $(LONGWAIT)
	# (Optional) Check the blockchains to which each Gateway is connected
	(cd gateway/satp/case_1 && python3 satp-evm-get-integrations.py)
	sleep $(SHORTWAIT)
	# Deploy the SATPTokenContract to both blockchains
	(cd EVM && node scripts/SATPTokenContract.js)
	sleep $(LONGWAIT)
	# Check the balances of the user and the bridge contract address
	(cd EVM && node scripts/SATPTokenContract-CheckBalances.js)
	sleep $(LONGWAIT)
	# Run the SATP protocol script (transactions, status, audit)
	@mkdir -p gateway/satp/case_1/outputs
	(cd gateway/satp/case_1 && python3 satp-transact.py > outputs/session_output.json)
	sleep $(SHORTWAIT)
	@if [ -s gateway/satp/case_1/outputs/session_output.json ]; then \
		export SESSION_ID=$$(cat gateway/satp/case_1/outputs/session_output.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('sessionID','')) if isinstance(d, dict) else print('')"); \
		if [ "$$SESSION_ID" != "" ]; then \
			(cd gateway/satp/case_1 && python3 satp-evm-check-status.py $$SESSION_ID); \
			sleep $(SHORTWAIT); \
			(cd gateway/satp/case_1 && python3 satp-evm-perform-audit.py); \
		else \
			echo "SESSION_ID not found in output, skipping status/audit checks."; \
		fi \
	else \
		echo "satp-transact did not produce output, skipping status/audit checks."; \
	fi
	sleep $(MEDIUMWAIT)
	# Check (again) the balances of the user and the bridge contract address
	(cd EVM && node scripts/SATPTokenContract-CheckBalances.js)

.PHONY: run-satp-case-2
run-satp-case-2:
	@echo "Running SATP Case 2: Gateway as Middleware for READ_AND_WRITE in EVM-based blockchains..."
	$(MAKE) clean-port-container PORT=3010
	# Start Hardhat EVM Blockchain 1 (port 8545)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8545 &)
	sleep $(MEDIUMWAIT)
	# Start Hardhat EVM Blockchain 2 (port 8546)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8546 &)
	sleep $(MEDIUMWAIT)
	# Start the Gateway (Docker Compose)
	(cd gateway/satp/case_2 && docker compose up -d)
	sleep $(LONGWAIT)
	# (Optional) Check the blockchains to which each Gateway is connected
	(cd gateway/satp/case_2 && python3 satp-evm-get-integrations.py)
	sleep $(SHORTWAIT)
	# Deploy the SATPNonFungibleTokenContract to both blockchains
	(cd EVM && node scripts/SATPNonFungibleTokenContract.js)
	sleep $(LONGWAIT)
	# Run the SATP protocol script (transactions, status, audit)
	@mkdir -p gateway/satp/case_2/outputs
	(cd gateway/satp/case_2 && python3 satp-transact.py > outputs/session_output.json)
	sleep $(SHORTWAIT)
	@if [ -s gateway/satp/case_2/outputs/session_output.json ]; then \
		export SESSION_ID=$$(cat gateway/satp/case_2/outputs/session_output.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('sessionID','')) if isinstance(d, dict) else print('')"); \
		if [ "$$SESSION_ID" != "" ]; then \
			(cd gateway/satp/case_2 && python3 satp-evm-check-status.py $$SESSION_ID); \
			sleep $(SHORTWAIT); \
			(cd gateway/satp/case_2 && python3 satp-evm-perform-audit.py); \
		else \
			echo "SESSION_ID not found in output, skipping status/audit checks."; \
		fi \
	else \
		echo "satp-transact did not produce output, skipping status/audit checks."; \
	fi
	sleep $(MEDIUMWAIT)
	# Check (again) the balances of the user and the bridge contract address
	(cd EVM && node scripts/SATPTokenContract-CheckBalances.js)

.PHONY: run-satp-case-3
run-satp-case-3:
	@echo "Running SATP Case 3: Gateway as Middleware for READ_AND_WRITE in EVM-based blockchains..."
	$(MAKE) clean-port-container PORT=3010
	# Start Hardhat EVM Blockchain 1 (port 8545)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8545 &)
	sleep $(MEDIUMWAIT)
	# Start Hardhat EVM Blockchain 2 (port 8546)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8546 &)
	sleep $(MEDIUMWAIT)
	# Start Hardhat EVM Blockchain 3 (port 8547)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8547 &)
	sleep $(MEDIUMWAIT)
	# Start the Gateway (Docker Compose)
	(cd gateway/satp/case_3 && docker compose up -d)
	sleep $(LONGWAIT)
	# (Optional) Check the blockchains to which each Gateway is connected
	(cd gateway/satp/case_3 && python3 satp-evm-get-integrations.py)
	sleep $(SHORTWAIT)
	# Deploy the SATPFungibleTokenContract to all blockchains
	(cd EVM && node scripts/SATPTokenContractCase3.js 1)
	sleep $(LONGWAIT)
	# Run the SATP protocol script (transactions, status, audit)
	@mkdir -p gateway/satp/case_3/outputs
	(cd gateway/satp/case_3 && python3 satp-transact.py 1 > outputs/session_output1.json)
	sleep $(SHORTWAIT)
	@if [ -s gateway/satp/case_3/outputs/session_output1.json ]; then \
		export SESSION_ID=$$(cat gateway/satp/case_3/outputs/session_output1.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('sessionID','')) if isinstance(d, dict) else print('')"); \
		if [ "$$SESSION_ID" != "" ]; then \
			(cd gateway/satp/case_3 && python3 satp-evm-check-status.py $$SESSION_ID); \
			sleep $(SHORTWAIT); \
			(cd gateway/satp/case_3 && python3 satp-evm-perform-audit.py); \
		else \
			echo "SESSION_ID not found in output, skipping status/audit checks."; \
		fi \
	else \
		echo "satp-transact did not produce output, skipping status/audit checks."; \
	fi
	sleep $(MEDIUMWAIT)
	# Check (again) the balances of the user and the bridge contract address
	(cd EVM && node scripts/SATPTokenContract-CheckBalances-Case3.js)
	sleep $(SHORTWAIT)
	# Update SATPFungibleTokenContract permissions in blockchain2
	(cd EVM && node scripts/SATPTokenContractCase3.js 2)
	sleep $(LONGWAIT)
	# Run the SATP protocol script (transactions, status, audit)
	(cd gateway/satp/case_3 && python3 satp-transact.py 2 > outputs/session_output2.json)
	sleep $(SHORTWAIT)
	@if [ -s gateway/satp/case_3/outputs/session_output2.json ]; then \
		export SESSION_ID=$$(cat gateway/satp/case_3/outputs/session_output2.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('sessionID','')) if isinstance(d, dict) else print('')"); \
		if [ "$$SESSION_ID" != "" ]; then \
			(cd gateway/satp/case_3 && python3 satp-evm-check-status.py $$SESSION_ID); \
			sleep $(SHORTWAIT); \
			(cd gateway/satp/case_3 && python3 satp-evm-perform-audit.py); \
		else \
			echo "SESSION_ID not found in output, skipping status/audit checks."; \
		fi \
	else \
		echo "satp-transact did not produce output, skipping status/audit checks."; \
	fi
	sleep $(MEDIUMWAIT)
	# Check (again) the balances of the user and the bridge contract address
	(cd EVM && node scripts/SATPTokenContract-CheckBalances-Case3.js)
	sleep $(SHORTWAIT)
	# Update SATPFungibleTokenContract permissions in blockchain3
	(cd EVM && node scripts/SATPTokenContractCase3.js 3)
	sleep $(LONGWAIT)
	# Run the SATP protocol script (transactions, status, audit)
	(cd gateway/satp/case_3 && python3 satp-transact.py 3 > outputs/session_output3.json)
	sleep $(SHORTWAIT)
	@if [ -s gateway/satp/case_3/outputs/session_output3.json ]; then \
		export SESSION_ID=$$(cat gateway/satp/case_3/outputs/session_output3.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('sessionID','')) if isinstance(d, dict) else print('')"); \
		if [ "$$SESSION_ID" != "" ]; then \
			(cd gateway/satp/case_3 && python3 satp-evm-check-status.py $$SESSION_ID); \
			sleep $(SHORTWAIT); \
			(cd gateway/satp/case_3 && python3 satp-evm-perform-audit.py); \
		else \
			echo "SESSION_ID not found in output, skipping status/audit checks."; \
		fi \
	else \
		echo "satp-transact did not produce output, skipping status/audit checks."; \
	fi
	sleep $(MEDIUMWAIT)
	# Check (again) the balances of the user and the bridge contract address
	(cd EVM && node scripts/SATPTokenContract-CheckBalances-Case3.js)

.PHONY: run-oracle-case-1
run-oracle-case-1:
	@echo "Running Oracle Case 1: Gateway as Middleware for READ and WRITE in EVM-based blockchains..."
	$(MAKE) clean-port-container PORT=3010
	(cd gateway/oracle/case_1 && docker compose up -d)
	sleep $(SHORTWAIT)
	# Start Hardhat EVM Blockchain (port 8545)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8545 &)
	sleep $(MEDIUMWAIT)
	# Deploy the OracleTestContract smart contract
	(cd EVM && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1)
	sleep $(SHORTWAIT)
	# Run the Oracle interaction script (read/write via Gateway)
	(cd gateway/oracle/case_1 && python3 oracle-execute-manual-read-and-write.py)

.PHONY: run-oracle-case-2
run-oracle-case-2:
	@echo "Running Oracle Case 2: Gateway as Middleware for READ and WRITE on two EVM-based blockchains..."
	$(MAKE) clean-port-container PORT=3010
	(cd gateway/oracle/case_2 && docker compose up -d)
	sleep $(SHORTWAIT)
	# Start Hardhat EVM Blockchain 1 (port 8545)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8545 &)
	sleep $(SHORTWAIT)
	# Start Hardhat EVM Blockchain 2 (port 8546)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8546 &)
	sleep $(MEDIUMWAIT)
	# Deploy the OracleTestContract smart contract to both blockchains
	(cd EVM && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1)
	(cd EVM && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat2)
	sleep $(SHORTWAIT)
	# Run the Oracle interaction script (read/write via Gateway)
	(cd gateway/oracle/case_2 && python3 oracle-execute-auto-read-and-write.py)

.PHONY: run-oracle-case-3
run-oracle-case-3:
	@echo "Running Oracle Case 3: Registering a Polling Task to Periodically READ from EVM-based Blockchain..."
	$(MAKE) clean-port-container PORT=3010
	(cd gateway/oracle/case_3 && docker compose up -d)
	sleep $(SHORTWAIT)
	# Start Hardhat EVM Blockchain (port 8545)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8545 &)
	sleep $(MEDIUMWAIT)
	# Deploy the OracleTestContract smart contract
	(cd EVM && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1)
	sleep $(SHORTWAIT)
	# Register the polling task via Gateway
	(cd gateway/oracle/case_3 && python3 oracle-evm-register-poller.py)
	sleep $(SHORTWAIT)
	@mkdir -p gateway/oracle/case_3/outputs
	@echo "Now you can:"
	@echo "- Observe failing reads in Hardhat logs (Terminal 2)"
	@echo "- Trigger a write to the contract: cd gateway/oracle/case_3 && python3 oracle-evm-execute-update.py" and read calls should succeed
	@echo "- Check polling task status: cd gateway/oracle/case_3 && python3 oracle-evm-check-status.py <TASK_ID> > outputs/task_status_output.json"
	@echo "- Unregister the polling task: cd gateway/oracle/case_3 && python3 oracle-evm-unregister.py <TASK_ID>"

.PHONY: run-oracle-case-4
run-oracle-case-4:
	@echo "Running Oracle Case 4: Cross-Chain EVENT_LISTENING with READ_AND_UPDATE Tasks..."
	$(MAKE) clean-port-container PORT=3010
	(cd gateway/oracle/case_4 && docker compose up -d)
	sleep $(SHORTWAIT)
	# Start Hardhat EVM Blockchain 1 (port 8545)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8545 &)
	sleep $(SHORTWAIT)
	# Start Hardhat EVM Blockchain 2 (port 8546)
	(cd EVM && npx hardhat node --hostname 0.0.0.0 --port 8546 &)
	sleep $(MEDIUMWAIT)
	# Deploy the OracleTestContract smart contract to both blockchains
	(cd EVM && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1)
	(cd EVM && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat2)
	sleep $(SHORTWAIT)
	# Register the event listening task via Gateway
	(cd gateway/oracle/case_4 && python3 oracle-evm-register-listener.py)
	sleep $(SHORTWAIT)
	@mkdir -p gateway/oracle/case_4/outputs
	@echo "Now you can:"
	@echo "- Trigger the event in source chain: cd gateway/oracle/case_4 && python3 oracle-evm-execute-update.py"
	@echo "- Check task status: cd gateway/oracle/case_4 && python3 oracle-evm-check-status.py <TASK_ID>  > outputs/task_status_output.json"
	@echo "- Unregister the event listening task: cd gateway/oracle/case_4 && python3 oracle-evm-unregister.py <TASK_ID>"

.PHONY: run-all-cases
run-all-cases:
	@echo "Running all cases sequentially with cleanup and wait times..."
	$(MAKE) run-oracle-case-1
	$(MAKE) clean
	sleep $(SHORTWAIT)
	$(MAKE) run-oracle-case-2
	$(MAKE) clean
	sleep $(SHORTWAIT)
	$(MAKE) run-oracle-case-3
	$(MAKE) clean
	sleep $(SHORTWAIT)
	$(MAKE) run-oracle-case-4
	$(MAKE) clean
	sleep $(SHORTWAIT)
	$(MAKE) run-satp-case-1
	$(MAKE) clean
	sleep $(SHORTWAIT)
	$(MAKE) run-satp-case-2
	$(MAKE) clean
	@echo "All cases executed successfully. Cleaned up."

# Show help for all Makefile targets 
.PHONY: help
help:
	@echo "Available targets:"
	@grep -E '^[a-zA-Z0-9_-]+:($$| )' Makefile | grep -v '^_' | awk -F: '{printf "  %-20s %s\n", $$1, "- "}'
	@echo "\nRun 'make <target>' to execute a specific task."
# Makefile for SATP Gateway Demo

.PHONY: setup
setup: check-docker check-docker-compose check-nvm install-node check-hardhat check-python
	@echo "All dependencies are installed."

.PHONY: check-docker
check-docker:
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "Docker not found. Please install Docker."; \
		exit 1; \
	else \
		echo "Docker is installed."; \
	fi

.PHONY: check-docker-compose
check-docker-compose:
	@if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then \
		echo "Docker Compose not found. Please install Docker Compose."; \
		exit 1; \
	else \
		echo "Docker Compose is installed."; \
	fi

.PHONY: check-nvm
check-nvm:
	@if [ -z "$(shell command -v nvm)" ] && [ ! -d "$$HOME/.nvm" ]; then \
		$(MAKE) install-nvm; \
	else \
		echo "nvm is installed."; \
	fi

.PHONY: install-nvm
install-nvm:
	@echo "Installing nvm..." && \
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

.PHONY: install-node
install-node:
	@. $$HOME/.nvm/nvm.sh && nvm install 18.19.0 && nvm use 18.19.0 && nvm alias default 18.19.0

.PHONY: check-node
check-node:
	@. $$HOME/.nvm/nvm.sh && nvm use 18.19.0 && node -v | grep 'v18.19.0' || $(MAKE) install-node
.PHONY: check-python
check-python:
	@if ! command -v python3 >/dev/null 2>&1; then \
		echo "Python3 not found. Please install Python >= 3.8."; \
		exit 1; \
	fi; \
	PYVER=$$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])'); \
	REQVER=3.8; \
	if [ "$$(echo $$PYVER | awk -v req=$$REQVER 'BEGIN{split(req, r, "."); split($$0, v, "."); exit (v[1]<r[1] || (v[1]==r[1] && v[2]<r[2]))}')" = "1" ]; then \
		echo "Python >= 3.8 required. Found $$PYVER."; \
		exit 1; \
	else \
		echo "Python >= 3.8 is installed."; \
	fi

.PHONY: clean-port-container
clean-port-container:
	@echo "Checking for containers using port $(PORT)..."
	@container_id=$$(docker ps -q --filter "publish=$(PORT)"); \
	if [ -n "$$container_id" ]; then \
		echo "Stopping container using port $(PORT): $$container_id"; \
		docker stop $$container_id; \
		docker rm $$container_id; \
	else \
		echo "No container found using port $(PORT)."; \
	fi
