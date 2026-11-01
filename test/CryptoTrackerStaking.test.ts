import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("CryptoTrackerStaking", function () {
  let token: any;
  let staking: any;
  let owner: any;
  let user1: any;
  let user2: any;

  const INITIAL_MINT = ethers.parseEther("10000");
  const REWARD_RATE = ethers.parseEther("1"); // 1 CTK per second reward rate

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 1. Deploy CTK token
    const TokenFactory = await ethers.getContractFactory("CryptoTrackerToken");
    token = await TokenFactory.deploy(owner.address);
    await token.waitForDeployment();

    // 2. Deploy Staking Vault (stakingToken = CTK, rewardToken = CTK)
    const StakingFactory = await ethers.getContractFactory("CryptoTrackerStaking");
    staking = await StakingFactory.deploy(
      await token.getAddress(),
      await token.getAddress(),
      owner.address,
      REWARD_RATE
    );
    await staking.waitForDeployment();

    // 3. Fund staking contract with rewards pool (e.g. 100,000 CTK)
    const rewardFund = ethers.parseEther("100000");
    await token.mint(await staking.getAddress(), rewardFund);

    // 4. Mint tokens to users for testing
    await token.mint(user1.address, INITIAL_MINT);
    await token.mint(user2.address, INITIAL_MINT);

    // 5. Approve staking contract to spend tokens
    await token.connect(user1).approve(await staking.getAddress(), ethers.MaxUint256);
    await token.connect(user2).approve(await staking.getAddress(), ethers.MaxUint256);
  });

  describe("Deployment & Configuration", function () {
    it("Should set the correct staking & reward tokens", async function () {
      expect(await staking.stakingToken()).to.equal(await token.getAddress());
      expect(await staking.rewardToken()).to.equal(await token.getAddress());
      expect(await staking.owner()).to.equal(owner.address);
      expect(await staking.rewardRate()).to.equal(REWARD_RATE);
    });

    it("Should reject zero addresses at deployment", async function () {
      const StakingFactory = await ethers.getContractFactory("CryptoTrackerStaking");
      await expect(
        StakingFactory.deploy(ethers.ZeroAddress, await token.getAddress(), owner.address, REWARD_RATE)
      ).to.be.revertedWithCustomError(staking, "ZeroAddress");
    });
  });

  describe("Staking", function () {
    it("Should allow a user to stake tokens", async function () {
      const stakeAmount = ethers.parseEther("100");
      await expect(staking.connect(user1).stake(stakeAmount))
        .to.emit(staking, "Staked")
        .withArgs(user1.address, stakeAmount);

      expect(await staking.balances(user1.address)).to.equal(stakeAmount);
      expect(await staking.totalStaked()).to.equal(stakeAmount);
      expect(await token.balanceOf(user1.address)).to.equal(INITIAL_MINT - stakeAmount);
    });

    it("Should revert when staking 0 amount", async function () {
      await expect(staking.connect(user1).stake(0)).to.be.revertedWithCustomError(
        staking,
        "ZeroAmount"
      );
    });

    it("Should revert when paused", async function () {
      await staking.pause();
      await expect(
        staking.connect(user1).stake(ethers.parseEther("50"))
      ).to.be.revertedWithCustomError(staking, "EnforcedPause");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"));
    });

    it("Should allow unstaking tokens", async function () {
      const withdrawAmount = ethers.parseEther("40");
      await expect(staking.connect(user1).withdraw(withdrawAmount))
        .to.emit(staking, "Withdrawn")
        .withArgs(user1.address, withdrawAmount);

      expect(await staking.balances(user1.address)).to.equal(ethers.parseEther("60"));
      expect(await staking.totalStaked()).to.equal(ethers.parseEther("60"));
    });

    it("Should revert if withdrawing more than balance", async function () {
      await expect(
        staking.connect(user1).withdraw(ethers.parseEther("200"))
      ).to.be.revertedWithCustomError(staking, "InsufficientBalance");
    });

    it("Should revert when withdrawing 0", async function () {
      await expect(staking.connect(user1).withdraw(0)).to.be.revertedWithCustomError(
        staking,
        "ZeroAmount"
      );
    });
  });

  describe("Rewards Accumulation & Claiming", function () {
    it("Should accumulate rewards linearly over time", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"));

      // Advance time by 100 seconds
      await time.increase(100);

      const earned = await staking.earned(user1.address);
      // Since user1 is 100% of the pool, reward = ~100 seconds * 1 CTK/s = 100 CTK
      expect(earned).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("2"));
    });

    it("Should distribute rewards proportionally between multiple stakers", async function () {
      // User 1 stakes 100 CTK, User 2 stakes 300 CTK (1:3 ratio)
      await staking.connect(user1).stake(ethers.parseEther("100"));
      await staking.connect(user2).stake(ethers.parseEther("300"));

      await time.increase(100);

      const earned1 = await staking.earned(user1.address);
      const earned2 = await staking.earned(user2.address);

      // User 2 should earn roughly 3x what User 1 earned
      expect(earned2).to.be.closeTo(earned1 * 3n, ethers.parseEther("3"));
    });

    it("Should allow claiming accumulated rewards", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"));
      await time.increase(50);

      const balanceBefore = await token.balanceOf(user1.address);
      await staking.connect(user1).claimReward();
      const balanceAfter = await token.balanceOf(user1.address);

      expect(balanceAfter - balanceBefore).to.be.closeTo(
        ethers.parseEther("50"),
        ethers.parseEther("2")
      );
    });

    it("Should allow exit() to withdraw all stake and claim reward at once", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"));
      await time.increase(50);

      await staking.connect(user1).exit();

      expect(await staking.balances(user1.address)).to.equal(0);
      expect(await staking.totalStaked()).to.equal(0);
      expect(await token.balanceOf(user1.address)).to.be.above(INITIAL_MINT);
    });
  });

  describe("Admin & Operational Controls", function () {
    it("Should allow owner to update reward rate", async function () {
      const newRate = ethers.parseEther("2");
      await expect(staking.setRewardRate(newRate))
        .to.emit(staking, "RewardRateUpdated")
        .withArgs(REWARD_RATE, newRate);

      expect(await staking.rewardRate()).to.equal(newRate);
    });

    it("Should prevent non-owners from updating reward rate or pausing", async function () {
      await expect(
        staking.connect(user1).setRewardRate(ethers.parseEther("5"))
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");

      await expect(staking.connect(user1).pause()).to.be.revertedWithCustomError(
        staking,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});

