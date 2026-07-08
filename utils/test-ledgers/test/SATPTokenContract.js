const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe("SATPTokenContract", function () {

  async function deploySATPTokenContract() {
    [deployer, user, another] = await ethers.getSigners();

    SATPToken = await ethers.getContractFactory("SATPTokenContract");
    satp = await SATPToken.connect(deployer).deploy(deployer.address);

    return { satp, deployer, user, another };
  };

  it("should initialize correctly with correct roles and ID", async function () {
    const { satp, deployer } = await loadFixture(deploySATPTokenContract);
    expect(await satp.hasRole(await satp.OWNER_ROLE(), deployer.address)).to.be.true;
    expect(await satp.hasRole(await satp.BRIDGE_ROLE(), deployer.address)).to.be.true;
  });

  it("should allow minting by BRIDGE_ROLE", async function () {
    const { satp, deployer, user } = await loadFixture(deploySATPTokenContract);
    await expect(satp.connect(deployer).mint(user.address, 1000))
      .to.emit(satp, "Transfer")
      .withArgs(ZERO_ADDRESS, user.address, 1000);

    expect(await satp.balanceOf(user.address)).to.equal(1000);
  });

  it("should prevent minting by non-bridge address", async function () {
    const { satp, user } = await loadFixture(deploySATPTokenContract);
    await expect(satp.connect(user).mint(user.address, 1000)).to.be.reverted;
  });

  it("should allow burning by BRIDGE_ROLE", async function () {
    const { satp, deployer, user } = await loadFixture(deploySATPTokenContract);
    await satp.connect(deployer).mint(user.address, 1000);
    await satp.connect(deployer).burn(user.address, 500);

    expect(await satp.balanceOf(user.address)).to.equal(500);
  });

  it("should allow assigning tokens by BRIDGE_ROLE", async function () {
    const { satp, deployer, user } = await loadFixture(deploySATPTokenContract);
    await satp.connect(deployer).mint(deployer.address, 1000);

    // Assign 500 tokens from deployer to user
    await expect(satp.connect(deployer).assign(deployer.address, user.address, 500))
      .to.emit(satp, "Transfer")
      .withArgs(deployer.address, user.address, 500);

    expect(await satp.balanceOf(user.address)).to.equal(500);
    expect(await satp.balanceOf(deployer.address)).to.equal(500);
  });

  it("should fail assigning tokens if sender is not 'from'", async function () {
    const { satp, deployer, user, another } = await loadFixture(deploySATPTokenContract);
    await satp.connect(deployer).mint(user.address, 1000);

    // user tries to assign tokens from `user` to another
    await expect(
      satp.connect(deployer).assign(user.address, another.address, 200)
    ).to.be.revertedWith("The msgSender is not the owner");
  });

  it("should allow giving BRIDGE_ROLE to another address", async function () {
    const { satp, deployer, user } = await loadFixture(deploySATPTokenContract);
    await satp.connect(deployer).giveRole(user.address);

    expect(await satp.hasRole(await satp.BRIDGE_ROLE(), user.address)).to.be.true;
  });

  it("should allow new bridge role to mint", async function () {
    const { satp, deployer, user } = await loadFixture(deploySATPTokenContract);
    await satp.connect(deployer).giveRole(user.address);
    await satp.connect(user).mint(user.address, 777);

    expect(await satp.balanceOf(user.address)).to.equal(777);
  });

  it("should allow transfer of amount that was approved", async function () {
    const { satp, deployer, user, another } = await loadFixture(deploySATPTokenContract);

    // Mint tokens to user
    await satp.connect(deployer).mint(user.address, 1000);

    // user approves another to spend 300 tokens
    await expect(satp.connect(user).approve(another.address, 300))
      .to.emit(satp, "Approval")
      .withArgs(user.address, another.address, 300);

    // another transfers 300 tokens from user to deployer
    await expect(
      satp.connect(another).transferFrom(user.address, deployer.address, 300)
    )
      .to.emit(satp, "Transfer")
      .withArgs(user.address, deployer.address, 300);

    expect(await satp.balanceOf(user.address)).to.equal(700);
    expect(await satp.balanceOf(deployer.address)).to.equal(300);

    // allowance should now be 0
    expect(await satp.allowance(user.address, another.address)).to.equal(0);
  });

  it("should revert if trying to transfer more than approved amount", async function () {
    const { satp, deployer, user, another } = await loadFixture(deploySATPTokenContract);

    await satp.connect(deployer).mint(user.address, 500);

    await satp.connect(user).approve(another.address, 100);

    await expect(
      satp.connect(another).transferFrom(user.address, deployer.address, 200)
    ).to.be.reverted;
  });

  it("should revert if trying to transfer more than balance", async function () {
    const { satp, deployer, user, another } = await loadFixture(deploySATPTokenContract);

    await satp.connect(deployer).mint(user.address, 100);

    await satp.connect(user).approve(another.address, 200);

    await expect(
      satp.connect(another).transferFrom(user.address, deployer.address, 150)
    ).to.be.reverted;
  });

  it("should revert hasBridgeRole if no permission", async function () {
    const { satp, user } = await loadFixture(deploySATPTokenContract);
    await expect(satp.connect(user).hasBridgeRole(user.address)).to.be.revertedWithCustomError(
      satp,
      "noPermission"
    );
  });

  it("should confirm permission if has BRIDGE_ROLE", async function () {
    const { satp, deployer } = await loadFixture(deploySATPTokenContract);
    await expect(satp.connect(deployer).hasBridgeRole(deployer.address)).to.eventually.equal(true);
  });
});
