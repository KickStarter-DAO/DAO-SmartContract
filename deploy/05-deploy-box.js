const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  args = [];
  log("deploying box contract...");
  const box = await deploy("Box", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`Box deployed at ${box.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(box.address, args);
  }
  const timeLock = await ethers.getContract("TimeLock");
  const boxContract = await ethers.getContractAt("Box", box.address);
  const transferOwnerTx = await boxContract.transferOwnership(timeLock.address);
  await transferOwnerTx.wait(1);
  log("Ownership transfered!");
};

module.exports.tags = ["all", "box"];
