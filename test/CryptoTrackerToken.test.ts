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

    it("Should grant DEFAULT_ADMIN_ROLE, MINTER_ROLE and PAUSER_ROLE to owner", async function () {
      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await token.MINTER_ROLE();
      const PAUSER_ROLE = await token.PAUSER_ROLE();

      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await token.mint(addr1.address, mintAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(mintAmount);
    });

    it("Should allow assigned MINTER_ROLE account to mint", async function () {
      const MINTER_ROLE = await token.MINTER_ROLE();
      await token.grantRole(MINTER_ROLE, addr1.address);

      const mintAmount = ethers.parseEther("500");
      await token.connect(addr1).mint(addr2.address, mintAmount);
      expect(await token.balanceOf(addr2.address)).to.equal(mintAmount);
    });

    it("Should fail if a non-owner/non-minter tries to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        token.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "UnauthorizedCaller");
    });

    it("Should fail if minting exceeds max supply", async function () {
      const maxSupply = ethers.parseEther("10000000");
      // Mint exact max supply
      await token.mint(owner.address, maxSupply);
      
      // Try to mint 1 more token
      const oneToken = ethers.parseEther("1");
      await expect(
        token.mint(owner.address, oneToken)
      ).to.be.revertedWithCustomError(token, "ExceedsMaxSupply");
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

  describe("ERC20Permit", function () {
    it("Should expose DOMAIN_SEPARATOR and nonces for gasless approvals", async function () {
      const domainSeparator = await token.DOMAIN_SEPARATOR();
      expect(domainSeparator).to.be.a("string");
      expect(domainSeparator.length).to.equal(66); // 0x + 64 hex chars
      
      const nonce = await token.nonces(owner.address);
      expect(nonce).to.equal(0);
    });
  });
});
