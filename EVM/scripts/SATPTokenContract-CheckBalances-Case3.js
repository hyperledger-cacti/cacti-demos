const { ethers } = require("ethers");
const { config } = require("hardhat");

// Replace with your values
const SATP_TOKEN_BYTECODE = require("../artifacts/contracts/SATPTokenContract.sol/SATPTokenContract.json")["bytecode"];
const SATP_TOKEN_ABI = require("../artifacts/contracts/SATPTokenContract.sol/SATPTokenContract.json")["abi"];

async function main(port) {
  const provider = new ethers.JsonRpcProvider(`http://0.0.0.0:${port}`);
  
  let BRIDGE_ADDRESS;
  let START_ADDRESS_INDEX;
  let TOKEN_ADDRESS;
  
  if (port === 8545) {
    BRIDGE_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
    TOKEN_ADDRESS = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
    START_ADDRESS_INDEX = 0;
  } else if (port === 8546) {
    BRIDGE_ADDRESS = "0x8464135c8f25da09e49bc8782676a84730c318bc";
    TOKEN_ADDRESS = "0xbded0d2bf404bdcba897a74e6657f1f12e5c6fb6";
    START_ADDRESS_INDEX = 4;
  } else {
    BRIDGE_ADDRESS = "0x663f3ad617193148711d28f5334ee4ed07016602";
    TOKEN_ADDRESS = "0x95bd8d42f30351685e96c62eddc0d0613bf9a87a";
    START_ADDRESS_INDEX = 8;
  }

  const accounts = await provider.listAccounts();
  const deployerAddress = accounts[START_ADDRESS_INDEX].address;
  const userAddress = accounts[START_ADDRESS_INDEX + 1].address;

  const deployer = await provider.getSigner(accounts[START_ADDRESS_INDEX].address);
  const user = await provider.getSigner(accounts[START_ADDRESS_INDEX + 1].address);

  // load the SATPTokenContract already deployed in the previous step
  console.log(`${port} - Loading SATPTokenContract...`);
  const satpTokenContract = new ethers.Contract(
    TOKEN_ADDRESS,
    SATP_TOKEN_ABI,
    deployer
  );
  console.log(`${port} - SATPTokenContract address:`, satpTokenContract.target);

  // Check balance of user
  console.log(`${port} - Checking balance of user...`);
  const userBalance = await satpTokenContract.balanceOf(userAddress);
  console.log(`${port} - User Balance:`, userBalance.toString());
  
  // Check balance of bridge address
  console.log(`${port} - Checking balance of bridge address...`);
  const bridgeBalance = await satpTokenContract.balanceOf(BRIDGE_ADDRESS);
  console.log(`${port} - Bridge Contract Balance:`, bridgeBalance.toString());
}

main(8545).catch(console.error);
main(8546).catch(console.error);
main(8547).catch(console.error);
