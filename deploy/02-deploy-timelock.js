const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const { developmentChains, MIN_DELAY } = require("../helper-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  args = [MIN_DELAY, [], []];
  const timelock = await deploy("TimeLock", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`timelock deployed at ${timelock.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(timelock.address, args);
  }
};

module.exports.tags = ["all", "governanceToken"];
