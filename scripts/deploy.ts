import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy CryptoTrackerToken (CTK)
  const CryptoTrackerToken = await ethers.getContractFactory("CryptoTrackerToken");
  const token = await CryptoTrackerToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("CryptoTrackerToken (CTK) deployed to:", tokenAddress);

  // 2. Deploy CryptoTrackerStaking (Staking Vault)
  // Initial reward rate: 1 CTK per second (10^18 wei)
  const initialRewardRate = ethers.parseEther("1");
  const CryptoTrackerStaking = await ethers.getContractFactory("CryptoTrackerStaking");
  const staking = await CryptoTrackerStaking.deploy(
    tokenAddress,
    tokenAddress,
    deployer.address,
    initialRewardRate
  );
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("CryptoTrackerStaking deployed to:", stakingAddress);

  console.log("\nDeployment Summary:");
  console.log("-----------------------------------------");
  console.log(`CONTRACT_ADDRESS=${tokenAddress}`);
  console.log(`STAKING_CONTRACT_ADDRESS=${stakingAddress}`);
  console.log("-----------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
