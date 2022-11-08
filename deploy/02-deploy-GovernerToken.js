const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const { developmentChains, INITIAL_SUPPLY } = require("../helper-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const governanceToken = await deploy("GovernanceToken", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`governanceToken deployed at ${governanceToken.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(governanceToken.address, []);
  }

  const timeLock = await ethers.getContract("TimeLock");
  const governanceTokenContract = await ethers.getContractAt(
    "GovernanceToken",
    governanceToken.address
  );
  const transferOwnerTx = await governanceTokenContract.transferOwnership(
    timeLock.address
  );
  await transferOwnerTx.wait(1);
  log("governanceTokenContract Ownership transfered!");
};

module.exports.tags = ["all", "governanceToken"];
