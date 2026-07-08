require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat1: {
      url: "http://0.0.0.0:8545",
    },
    hardhat2: {
      url: "http://0.0.0.0:8546",
      // accounts 4, 5, and 6
      accounts: ["0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba", "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e"],
    },
    hardhat3: {
      url: "http://0.0.0.0:8547",
    },
  },
};
