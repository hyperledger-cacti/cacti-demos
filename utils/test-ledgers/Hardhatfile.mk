.PHONY: hardhat-up hardhat-down hardhat-deploy

hardhat-up:
	(cd utils/test-ledgers && npx hardhat node --hostname 0.0.0.0 --port 8545 &)
	sleep 2
	(cd utils/test-ledgers && npx hardhat node --hostname 0.0.0.0 --port 8546 &)
	sleep 2

hardhat-down:
	@lsof -ti:8545 | xargs -r kill -9 || true
	@lsof -ti:8546 | xargs -r kill -9 || true

hardhat-deploy:
	(cd utils/test-ledgers && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1)
	sleep 6
	(cd utils/test-ledgers && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat2)
	sleep 6
