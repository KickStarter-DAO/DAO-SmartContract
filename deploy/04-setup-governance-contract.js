const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const {
  developmentChains,
  VOTING_PERIOD,
  VOTING_DELAY,
  QUORUM_PERCENTAGE,
} = require("../helper-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const governanceToken = await ethers.getContract("GovernanceToken", deployer);
  const timelock = await ethers.getContract("TimeLock", deployer);

  console.log("Setting up roles...");
  args = [
    governanceToken.address,
    timelock.address,
    VOTING_DELAY,
    VOTING_PERIOD,
    QUORUM_PERCENTAGE,
  ];
  const governorContract = await deploy("GovernerContract", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`governorContract deployed at ${governorContract.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(governorContract.address, args);
  }
};

module.exports.tags = ["all", "governorContract"];
