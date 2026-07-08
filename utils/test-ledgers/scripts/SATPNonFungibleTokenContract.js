const { ethers } = require("ethers");
const { config } = require("hardhat");

// Replace with your values
const SATP_TOKEN_BYTECODE = require("../artifacts/contracts/SATPNonFungibleTokenContract.sol/SATPNonFungibleTokenContract.json")["bytecode"];
const SATP_TOKEN_ABI = require("../artifacts/contracts/SATPNonFungibleTokenContract.sol/SATPNonFungibleTokenContract.json")["abi"];

async function main(port) {
  const provider = new ethers.JsonRpcProvider(`http://0.0.0.0:${port}`);
  
  // To avoid the same addresses being used in both blockchains, we can adjust the starting index based on the port.
  const START_ADDRESS_INDEX = port === 8545 ? 0 : 4; // Adjust based on the port
  
  // Since we deploy the contracts always in the same order, we can use a constant address for the bridge.
  const BRIDGE_ADDRESS =  port === 8545 ? "0x5fbdb2315678afecb367f032d93f642f64180aa3" : "0x8464135c8f25da09e49bc8782676a84730c318bc";

  const accounts = await provider.listAccounts();

  const deployerAddress = accounts[START_ADDRESS_INDEX].address;
  console.log(`${port} - Deployer Address:`, deployerAddress);

  const userAddress = accounts[START_ADDRESS_INDEX + 1].address;
  console.log(`${port} - User Address:`, userAddress);

  const deployer = await provider.getSigner(accounts[START_ADDRESS_INDEX].address);
  const user = await provider.getSigner(accounts[START_ADDRESS_INDEX + 1].address);

  // Deploy the SATPNonFungibleTokenContract
  console.log(`${port} - Deploying SATPNonFungibleTokenContract...`);
  const SATPNonFungibleTokenContractFactory = new ethers.ContractFactory(SATP_TOKEN_ABI, SATP_TOKEN_BYTECODE, deployer);
  const satpNonFungibleTokenContract = await SATPNonFungibleTokenContractFactory.deploy(deployerAddress);
  await satpNonFungibleTokenContract.waitForDeployment();
  console.log(`${port} - SATPNonFungibleTokenContract deployed to:`, satpNonFungibleTokenContract.target);

  // Give BRIDGE_ROLE to bridge address so that the bridge can interact with the contract and call functions like mint, burn, etc.
  console.log(`${port} - Giving role to bridge address...`);
  const giveRole2Tx = await satpNonFungibleTokenContract.connect(deployer).grantBridgeRole(BRIDGE_ADDRESS);
  await giveRole2Tx.wait();

  if (port === 8545) {
    // Mint tokens to the user address in the source chain (8545)
    console.log(`${port} - Minting tokens...`);
    const mintTx = await satpNonFungibleTokenContract.connect(deployer).mint(userAddress, 1001);
    await mintTx.wait();
    
    // Approve bridge address to spend tokens on behalf of the user in the source chain (8545)
    console.log(`${port} - Approving bridge address...`);
    const approve2Tx = await satpNonFungibleTokenContract.connect(user).approve(BRIDGE_ADDRESS, 1001);
    await approve2Tx.wait();
    
    // Check allowance of bridge address given by user in the source chain (8545)
    console.log(`${port} - Checking allowance...`);
    const allowance = await satpNonFungibleTokenContract.hasPermission(
      BRIDGE_ADDRESS,
      1001
    );
    console.log(`${port} - Allowance:`, allowance.toString());
  }
}

main(8545).catch(console.error);
main(8546).catch(console.error);
