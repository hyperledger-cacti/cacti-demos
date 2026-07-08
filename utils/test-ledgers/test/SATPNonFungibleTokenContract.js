const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe("SATPNonFungibleTokenContract", function () {

  async function deploySATPNonFungibleTokenContract() {
    [deployer, user, another] = await ethers.getSigners();

    SATPNonFungibleToken = await ethers.getContractFactory("SATPNonFungibleTokenContract");
    satp = await SATPNonFungibleToken.connect(deployer).deploy(deployer.address);

    return { satp, deployer, user, another };
  };

  it("should initialize correctly with correct roles and ID", async function () {
    const { satp, deployer } = await loadFixture(deploySATPNonFungibleTokenContract);
    expect(await satp.hasRole(await satp.OWNER_ROLE(), deployer.address)).to.be.true;
    expect(await satp.hasRole(await satp.BRIDGE_ROLE(), deployer.address)).to.be.true;
  });

  it("should allow minting by BRIDGE_ROLE", async function () {
    const { satp, deployer, user } = await loadFixture(deploySATPNonFungibleTokenContract);
    await expect(satp.connect(deployer).mint(user.address, 1001))
      .to.emit(satp, "Transfer")
      .withArgs(ZERO_ADDRESS, user.address, 1001);

    expect(await satp.balanceOf(user.address)).to.equal(1);
  });

  it("should prevent minting by non-bridge address", async function () {
    const { satp, user } = await loadFixture(deploySATPNonFungibleTokenContract);
    await expect(satp.connect(user).mint(user.address, 1001)).to.be.reverted;
  });

  it("should allow burning by BRIDGE_ROLE", async function () {
    const { satp, deployer, user } = await loadFixture(deploySATPNonFungibleTokenContract);
    await satp.connect(deployer).mint(user.address, 1001);
    await satp.connect(deployer).mint(user.address, 1002);
    await satp.connect(user).approve(deployer.address, 1001);
    await satp.connect(deployer).burn(1001);

    expect(await satp.balanceOf(user.address)).to.equal(1);
  });

  it("should allow assigning tokens by BRIDGE_ROLE", async function () {
    const { satp, deployer, user } = await loadFixture(deploySATPNonFungibleTokenContract);
    await satp.connect(deployer).mint(deployer.address, 1001);

    // Assign 500 tokens from deployer to user
    await expect(satp.connect(deployer).assign(user.address, 1001))
      .to.emit(satp, "Transfer")
      .withArgs(deployer.address, user.address, 1001);

    expect(await satp.balanceOf(user.address)).to.equal(1);
    expect(await satp.balanceOf(deployer.address)).to.equal(0);
  });

  it("should fail assigning tokens if sender is not 'from'", async function () {
    const { satp, deployer, user, another } = await loadFixture(deploySATPNonFungibleTokenContract);
    await satp.connect(deployer).mint(user.address, 1001);

    // user tries to assign tokens from `user` to another
    await expect(
      satp.connect(deployer).assign(another.address, 1001)
    ).to.be.reverted;
  });

  it("should allow giving BRIDGE_ROLE to another address", async function () {
    const { satp, deployer, user } = await loadFixture(deploySATPNonFungibleTokenContract);
    await satp.connect(deployer).grantBridgeRole(user.address);

    expect(await satp.hasRole(await satp.BRIDGE_ROLE(), user.address)).to.be.true;
  });

  it("should allow new bridge role to mint", async function () {
    const { satp, deployer, user } = await loadFixture(deploySATPNonFungibleTokenContract);
    await satp.connect(deployer).grantBridgeRole(user.address);
    await satp.connect(user).mint(user.address, 1001);

    expect(await satp.balanceOf(user.address)).to.equal(1);
  });

  it("should allow transfer of amount that was approved", async function () {
    const { satp, deployer, user, another } = await loadFixture(deploySATPNonFungibleTokenContract);

    // Mint tokens to user
    await satp.connect(deployer).mint(user.address, 1001);

    // user approves another to spend nft with descriptor 1001
    await expect(satp.connect(user).approve(another.address, 1001))
      .to.emit(satp, "Approval")
      .withArgs(user.address, another.address, 1001);

    // another transfers nft 1001 from user to deployer
    await expect(
      satp.connect(another).transferFrom(user.address, deployer.address, 1001)
    )
      .to.emit(satp, "Transfer")
      .withArgs(user.address, deployer.address, 1001);

    expect(await satp.balanceOf(user.address)).to.equal(0);
    expect(await satp.balanceOf(deployer.address)).to.equal(1);
  });

  it("should revert if trying to transfer unapproved nft", async function () {
    const { satp, deployer, user, another } = await loadFixture(deploySATPNonFungibleTokenContract);

    await satp.connect(deployer).mint(user.address, 1001);
    await satp.connect(deployer).mint(user.address, 1002);

    await satp.connect(user).approve(another.address, 1001);

    await expect(
      satp.connect(another).transferFrom(user.address, deployer.address, 1002)
    ).to.be.reverted;
  });

  it("should revert hasBridgeRole if no permission", async function () {
    const { satp, user } = await loadFixture(deploySATPNonFungibleTokenContract);
    await expect(satp.connect(user).hasBridgeRole(user.address)).to.be.revertedWithCustomError(
      satp,
      "noPermission"
    );
  });

  it("should confirm permission if has BRIDGE_ROLE", async function () {
    const { satp, deployer } = await loadFixture(deploySATPNonFungibleTokenContract);
    await expect(satp.connect(deployer).hasBridgeRole(deployer.address)).to.eventually.equal(true);
  });
});
