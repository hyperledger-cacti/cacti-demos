const { ethers } = require("ethers");
const { config } = require("hardhat");

// Replace with your values
const SATP_TOKEN_BYTECODE = require("../artifacts/contracts/SATPTokenContract.sol/SATPTokenContract.json")["bytecode"];
const SATP_TOKEN_ABI = require("../artifacts/contracts/SATPTokenContract.sol/SATPTokenContract.json")["abi"];

async function main(port) {
  const provider = new ethers.JsonRpcProvider(`http://0.0.0.0:${port}`);
  
  let BRIDGE_ADDRESS;
  let START_ADDRESS_INDEX;
  
  if (port === 8545) {
    BRIDGE_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
    START_ADDRESS_INDEX = 0;
  } else if (port === 8546) {
    BRIDGE_ADDRESS = "0x8464135c8f25da09e49bc8782676a84730c318bc";
    START_ADDRESS_INDEX = 4;
  } else {
    BRIDGE_ADDRESS = "0x663f3ad617193148711d28f5334ee4ed07016602";
    START_ADDRESS_INDEX = 8;
  }

  const accounts = await provider.listAccounts();
  const deployerAddress = accounts[START_ADDRESS_INDEX].address;
  const userAddress = accounts[START_ADDRESS_INDEX + 1].address;
  

  const deployer = await provider.getSigner(accounts[START_ADDRESS_INDEX].address);
  const user = await provider.getSigner(accounts[START_ADDRESS_INDEX + 1].address);

  if (process.argv[2] !== undefined && typeof Number(process.argv[2]) === 'number') {
    if (Number(process.argv[2]) === 1) {
      console.log(`${port} - Deployer Address:`, deployerAddress);
      console.log(`${port} - User Address:`, userAddress);
      // Deploy the SATPTokenContract
      console.log(`${port} - Deploying SATPTokenContract...`);
      const SATPTokenContractFactory = new ethers.ContractFactory(SATP_TOKEN_ABI, SATP_TOKEN_BYTECODE, deployer);
      const satpTokenContract = await SATPTokenContractFactory.deploy(deployerAddress);
      await satpTokenContract.waitForDeployment();
      console.log(`${port} - SATPTokenContract deployed to:`, satpTokenContract.target);

      // Give BRIDGE_ROLE to bridge address so that the bridge can interact with the contract and call functions like mint, burn, etc.
      console.log(`${port} - Giving role to bridge address...`);
      const giveRole2Tx = await satpTokenContract.connect(deployer).giveRole(BRIDGE_ADDRESS);
      await giveRole2Tx.wait();

      if (port === 8545) {
        // Mint tokens to the user address in the source chain (8545)
        console.log(`${port} - Minting tokens...`);
        const mintTx = await satpTokenContract.connect(deployer).mint(userAddress, 100);
        await mintTx.wait();
        
        // Approve bridge address to spend tokens on behalf of the user in the source chain (8545)
        console.log(`${port} - Approving bridge address ${BRIDGE_ADDRESS}...`);
        const approve2Tx = await satpTokenContract.connect(user).approve(BRIDGE_ADDRESS, 100);
        await approve2Tx.wait();
        
        // Check allowance of bridge address given by user in the source chain (8545)
        console.log(`${port} - Checking allowance...`);
        const allowance = await satpTokenContract.allowance(
          userAddress,
          BRIDGE_ADDRESS
        );
        console.log(`${port} - Allowance:`, allowance.toString());
      }
    }
    else if (Number(process.argv[2]) === 2) {
      if (port === 8546) {
        const deployedSatpTokenContract = new ethers.Contract("0xbdEd0D2bf404bdcBa897a74E6657f1f12e5C6fb6", SATP_TOKEN_ABI, provider);
        // Approve bridge address to spend tokens on behalf of the user in the source chain (8546)
        console.log(`${port} - Approving bridge address ${BRIDGE_ADDRESS}...`);
        const approve2Tx = await deployedSatpTokenContract.connect(user).approve(BRIDGE_ADDRESS, 100);
        await approve2Tx.wait();
        
        // Check allowance of bridge address given by user in the source chain (8546)
        console.log(`${port} - Checking allowance...`);
        const allowance = await deployedSatpTokenContract.allowance(
          userAddress,
          BRIDGE_ADDRESS
        );
        console.log(`${port} - Allowance:`, allowance.toString());
      }
    }
    else if (Number(process.argv[2]) === 3) {
      if (port === 8547) {
        const deployedSatpTokenContract = new ethers.Contract("0x95bD8D42f30351685e96C62EDdc0d0613bf9a87A", SATP_TOKEN_ABI, provider);
        // Approve bridge address to spend tokens on behalf of the user in the source chain (8547)
        console.log(`${port} - Approving bridge address ${BRIDGE_ADDRESS}...`);
        const approve2Tx = await deployedSatpTokenContract.connect(user).approve(BRIDGE_ADDRESS, 100);
        await approve2Tx.wait();
        
        // Check allowance of bridge address given by user in the source chain (8547)
        console.log(`${port} - Checking allowance...`);
        const allowance = await deployedSatpTokenContract.allowance(
          userAddress,
          BRIDGE_ADDRESS
        );
        console.log(`${port} - Allowance:`, allowance.toString());
      }
    }
  } 
  else {
    console.error("Please provide the step as a number argument at call time (1, 2, or 3).");
  }   
}

main(8545).catch(console.error);
main(8546).catch(console.error);
main(8547).catch(console.error);
