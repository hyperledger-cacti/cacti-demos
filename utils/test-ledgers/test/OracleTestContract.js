const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OracleTestContract", function () {

  async function deployOracleContract() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Oracle = await ethers.getContractFactory("OracleTestContract");
    const oracle = await Oracle.deploy();

    return { oracle, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { oracle, owner } = await loadFixture(deployOracleContract);

      // expect(await oracle.owner()).to.equal(owner.address);
    });

    it("Should write and read data", async function () {
      const { oracle, owner } = await loadFixture(
        deployOracleContract
      );

      const newData = "Hello, world!";
      await oracle.setData(newData);

      const encodedData = (new ethers.AbiCoder()).encode(
        ["string"],
        [newData]
      );

      const hash_newData = ethers.keccak256(encodedData);

      expect(await oracle.getData(hash_newData)).to.equal(newData);
    });

    it("Should emit UpdatedData event", async function () {
      const { oracle, owner } = await loadFixture(
        deployOracleContract
      );

      const newData = "Hello, world 1!";

      const encodedData = (new ethers.AbiCoder()).encode(
        ["string"],
        [newData]
      );

      const hash_newData = ethers.keccak256(encodedData);

      await expect(oracle.setData(newData))
        .to.emit(oracle, "UpdatedData")
        .withArgs(hash_newData, newData, 1);
    });
    
    it("Should revert if data is not found", async function () {
      const { oracle } = await loadFixture(
        deployOracleContract
      );
      
      const encodedData = (new ethers.AbiCoder()).encode(
        ["string"],
        ["Invalid Id"]
      );

      const hash_invalid_data = ethers.keccak256(encodedData);

      await expect(oracle.getData(hash_invalid_data)).to.be.revertedWith(
        "Data not found"
      );
    });  
  });
});
