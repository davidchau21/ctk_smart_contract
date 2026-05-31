import { expect } from "chai";
import { ethers } from "hardhat";

describe("CryptoTrackerToken", function () {
  let token: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const CryptoTrackerTokenFactory = await ethers.getContractFactory("CryptoTrackerToken");
    token = await CryptoTrackerTokenFactory.deploy(owner.address);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should have the correct name and symbol", async function () {
      expect(await token.name()).to.equal("CryptoTracker Token");
      expect(await token.symbol()).to.equal("CTK");
    });

    it("Should start with 0 total supply", async function () {
      expect(await token.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await token.mint(addr1.address, mintAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(mintAmount);
    });

    it("Should fail if a non-owner tries to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        token.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should fail if minting exceeds max supply", async function () {
      const maxSupply = ethers.parseEther("10000000");
      // Mint exact max supply
      await token.mint(owner.address, maxSupply);
      
      // Try to mint 1 more token
      const oneToken = ethers.parseEther("1");
      await expect(
        token.mint(owner.address, oneToken)
      ).to.be.revertedWith("CTK: Max supply exceeded");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      const mintAmount = ethers.parseEther("1000");
      await token.mint(addr1.address, mintAmount);
    });

    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("100");
      await token.connect(addr1).transfer(addr2.address, transferAmount);
      expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("900"));
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      const mintAmount = ethers.parseEther("1000");
      await token.mint(addr1.address, mintAmount);
    });

    it("Should allow users to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      await token.connect(addr1).burn(burnAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("900"));
      expect(await token.totalSupply()).to.equal(ethers.parseEther("900"));
    });
  });

  describe("Pausable", function () {
    beforeEach(async function () {
      const mintAmount = ethers.parseEther("1000");
      await token.mint(addr1.address, mintAmount);
    });

    it("Should prevent transfers when paused", async function () {
      await token.pause();
      
      const transferAmount = ethers.parseEther("100");
      await expect(
        token.connect(addr1).transfer(addr2.address, transferAmount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should allow transfers again when unpaused", async function () {
      await token.pause();
      await token.unpause();

      const transferAmount = ethers.parseEther("100");
      await token.connect(addr1).transfer(addr2.address, transferAmount);
      expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
    });
  });
});
