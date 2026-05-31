import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // We pass the deployer's address as the initialOwner
  const CryptoTrackerToken = await ethers.getContractFactory("CryptoTrackerToken");
  const token = await CryptoTrackerToken.deploy(deployer.address);

  await token.waitForDeployment();
  const address = await token.getAddress();

  console.log("CryptoTrackerToken deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
